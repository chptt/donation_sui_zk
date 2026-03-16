module donation_platform::donation_platform {
    use std::string::String;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::event;

    // Error codes
    const E_NOT_CREATOR: u64 = 1;
    const E_INVALID_AMOUNT: u64 = 2;
    const E_CAMPAIGN_NOT_ACTIVE: u64 = 3;

    // Campaign object (lives on-chain as a shared object)
    public struct Campaign has key, store {
        id: UID,
        creator: address,
        title: String,
        description: String,
        charity_type: String,
        goal_amount: u64,
        total_donated: u64,
        active: bool,
        balance: Balance<SUI>,
    }

    // Events
    public struct CampaignCreated has copy, drop {
        campaign_id: address,
        creator: address,
        title: String,
        goal_amount: u64,
    }

    public struct DonationMade has copy, drop {
        campaign_id: address,
        donor: address,
        amount: u64,
    }

    public struct FundsWithdrawn has copy, drop {
        campaign_id: address,
        creator: address,
        amount: u64,
    }

    // Create a new campaign (shared object so anyone can donate to it)
    public entry fun create_campaign(
        title: String,
        description: String,
        charity_type: String,
        goal_amount: u64,
        ctx: &mut TxContext,
    ) {
        let campaign_uid = object::new(ctx);
        let campaign_id = object::uid_to_address(&campaign_uid);

        let campaign = Campaign {
            id: campaign_uid,
            creator: tx_context::sender(ctx),
            title,
            description,
            charity_type,
            goal_amount,
            total_donated: 0,
            active: true,
            balance: balance::zero<SUI>(),
        };

        event::emit(CampaignCreated {
            campaign_id,
            creator: tx_context::sender(ctx),
            title: campaign.title,
            goal_amount,
        });

        transfer::share_object(campaign);
    }

    // Donate SUI coins to a campaign
    public entry fun donate_to_campaign(
        campaign: &mut Campaign,
        payment: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        assert!(campaign.active, E_CAMPAIGN_NOT_ACTIVE);
        let amount = coin::value(&payment);
        assert!(amount > 0, E_INVALID_AMOUNT);

        let campaign_id = object::uid_to_address(&campaign.id);

        campaign.total_donated = campaign.total_donated + amount;
        balance::join(&mut campaign.balance, coin::into_balance(payment));

        event::emit(DonationMade {
            campaign_id,
            donor: tx_context::sender(ctx),
            amount,
        });
    }

    // Withdraw all funds — only the campaign creator can call this
    public entry fun withdraw_funds(
        campaign: &mut Campaign,
        ctx: &mut TxContext,
    ) {
        assert!(campaign.creator == tx_context::sender(ctx), E_NOT_CREATOR);

        let amount = balance::value(&campaign.balance);
        let withdrawn = coin::from_balance(balance::split(&mut campaign.balance, amount), ctx);

        campaign.active = false;

        event::emit(FundsWithdrawn {
            campaign_id: object::uid_to_address(&campaign.id),
            creator: campaign.creator,
            amount,
        });

        transfer::public_transfer(withdrawn, campaign.creator);
    }

    // Read-only accessors
    public fun get_campaign_info(campaign: &Campaign): (address, String, String, String, u64, u64, bool) {
        (
            campaign.creator,
            campaign.title,
            campaign.description,
            campaign.charity_type,
            campaign.goal_amount,
            campaign.total_donated,
            campaign.active,
        )
    }
}
