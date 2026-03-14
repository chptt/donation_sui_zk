 module donation_platform::donation_platform {
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account;

    // Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_NOT_CREATOR: u64 = 3;
    const E_INVALID_AMOUNT: u64 = 4;
    const E_CAMPAIGN_NOT_ACTIVE: u64 = 5;
    const E_CAMPAIGN_NOT_FOUND: u64 = 6;

    // Campaign resource
    struct Campaign has store, drop, copy {
        id: u64,
        creator: address,
        title: String,
        description: String,
        charity_type: String,
        goal_amount: u64,
        total_donated: u64,
        active: bool,
    }

    // Donation record
    struct Donation has store, drop, copy {
        donor: address,
        amount: u64,
        campaign_id: u64,
    }

    // Global storage for campaigns
    struct CampaignStore has key {
        campaign_count: u64,
        campaigns: vector<Campaign>,
        donations: vector<Donation>,
    }

    // Initialize the platform (call once)
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        assert!(!exists<CampaignStore>(account_addr), E_ALREADY_INITIALIZED);
        
        move_to(account, CampaignStore {
            campaign_count: 0,
            campaigns: vector::empty<Campaign>(),
            donations: vector::empty<Donation>(),
        });
    }

    // Create a new campaign
    public entry fun create_campaign(
        account: &signer,
        title: String,
        description: String,
        charity_type: String,
        goal_amount: u64,
        platform_address: address,
    ) acquires CampaignStore {
        assert!(exists<CampaignStore>(platform_address), E_NOT_INITIALIZED);
        
        let store = borrow_global_mut<CampaignStore>(platform_address);
        let campaign_id = store.campaign_count + 1;
        
        let campaign = Campaign {
            id: campaign_id,
            creator: signer::address_of(account),
            title,
            description,
            charity_type,
            goal_amount,
            total_donated: 0,
            active: true,
        };
        
        vector::push_back(&mut store.campaigns, campaign);
        store.campaign_count = campaign_id;
    }

    // Donate to a campaign
    public entry fun donate_to_campaign(
        donor: &signer,
        campaign_id: u64,
        amount: u64,
        platform_address: address,
    ) acquires CampaignStore {
        assert!(exists<CampaignStore>(platform_address), E_NOT_INITIALIZED);
        assert!(amount > 0, E_INVALID_AMOUNT);
        
        let store = borrow_global_mut<CampaignStore>(platform_address);
        let campaigns = &mut store.campaigns;
        let len = vector::length(campaigns);
        let i = 0;
        let found = false;
        
        while (i < len) {
            let campaign = vector::borrow_mut(campaigns, i);
            if (campaign.id == campaign_id) {
                assert!(campaign.active, E_CAMPAIGN_NOT_ACTIVE);
                
                // Transfer coins from donor to campaign creator
                coin::transfer<AptosCoin>(donor, campaign.creator, amount);
                
                // Update campaign
                campaign.total_donated = campaign.total_donated + amount;
                
                // Record donation
                let donation = Donation {
                    donor: signer::address_of(donor),
                    amount,
                    campaign_id,
                };
                vector::push_back(&mut store.donations, donation);
                
                found = true;
                break
            };
            i = i + 1;
        };
        
        assert!(found, E_CAMPAIGN_NOT_FOUND);
    }

    // Withdraw funds (only creator)
    public entry fun withdraw_funds(
        creator: &signer,
        campaign_id: u64,
        platform_address: address,
    ) acquires CampaignStore {
        assert!(exists<CampaignStore>(platform_address), E_NOT_INITIALIZED);
        
        let store = borrow_global_mut<CampaignStore>(platform_address);
        let campaigns = &mut store.campaigns;
        let len = vector::length(campaigns);
        let i = 0;
        let found = false;
        
        while (i < len) {
            let campaign = vector::borrow_mut(campaigns, i);
            if (campaign.id == campaign_id) {
                assert!(campaign.creator == signer::address_of(creator), E_NOT_CREATOR);
                campaign.active = false;
                found = true;
                break
            };
            i = i + 1;
        };
        
        assert!(found, E_CAMPAIGN_NOT_FOUND);
    }

    // View functions
    #[view]
    public fun get_campaign_count(platform_address: address): u64 acquires CampaignStore {
        if (!exists<CampaignStore>(platform_address)) {
            return 0
        };
        borrow_global<CampaignStore>(platform_address).campaign_count
    }

    #[view]
    public fun get_campaigns(platform_address: address): vector<Campaign> acquires CampaignStore {
        if (!exists<CampaignStore>(platform_address)) {
            return vector::empty<Campaign>()
        };
        *&borrow_global<CampaignStore>(platform_address).campaigns
    }

    #[view]
    public fun get_donations(platform_address: address): vector<Donation> acquires CampaignStore {
        if (!exists<CampaignStore>(platform_address)) {
            return vector::empty<Donation>()
        };
        *&borrow_global<CampaignStore>(platform_address).donations
    }
}
