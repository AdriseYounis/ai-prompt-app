// MongoDB initialization script

// Create collections
db = db.getSiblingDB('ai_prompt_app');

// Brand Data Collection
db.createCollection('brands');
db.brands.insertMany([
    {
        name: "Brand 1",
        description: "Premium brand description",
        logo_url: "https://example.com/brand1-logo.png",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Brand 2",
        description: "Luxury brand description",
        logo_url: "https://example.com/brand2-logo.png",
        created_at: new Date(),
        updated_at: new Date()
    }
]);

// Brand Content Collection
db.createCollection('brand_content');
db.brand_content.insertMany([
    {
        brand_id: db.brands.findOne({ name: "Brand 1" })._id,
        content_type: "description",
        content: "Detailed brand content for Brand 1",
        language: "en",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        brand_id: db.brands.findOne({ name: "Brand 2" })._id,
        content_type: "description",
        content: "Detailed brand content for Brand 2",
        language: "en",
        created_at: new Date(),
        updated_at: new Date()
    }
]);

// Partner Data Collection
db.createCollection('partners');
db.partners.insertMany([
    {
        name: "Partner 1",
        type: "Retailer",
        contact_email: "partner1@example.com",
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Partner 2",
        type: "Distributor",
        contact_email: "partner2@example.com",
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
    }
]);

// Bridging Content Collection
db.createCollection('bridging_content');
db.bridging_content.insertMany([
    {
        brand_id: db.brands.findOne({ name: "Brand 1" })._id,
        partner_id: db.partners.findOne({ name: "Partner 1" })._id,
        content_type: "product_description",
        content: "Customized content for Partner 1",
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        brand_id: db.brands.findOne({ name: "Brand 2" })._id,
        partner_id: db.partners.findOne({ name: "Partner 2" })._id,
        content_type: "product_description",
        content: "Customized content for Partner 2",
        created_at: new Date(),
        updated_at: new Date()
    }
]);

// Pricing Source Collection
db.createCollection('pricing_sources');
db.pricing_sources.insertMany([
    {
        source_name: "Source 1",
        brand_id: db.brands.findOne({ name: "Brand 1" })._id,
        price_type: "retail",
        currency: "USD",
        price: 99.99,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        source_name: "Source 2",
        brand_id: db.brands.findOne({ name: "Brand 2" })._id,
        price_type: "wholesale",
        currency: "USD",
        price: 199.99,
        created_at: new Date(),
        updated_at: new Date()
    }
]);

// Create indexes
db.brands.createIndex({ name: 1 }, { unique: true });
db.partners.createIndex({ name: 1 }, { unique: true });
db.brand_content.createIndex({ brand_id: 1 });
db.bridging_content.createIndex({ brand_id: 1, partner_id: 1 });
db.pricing_sources.createIndex({ brand_id: 1, source_name: 1 });

print("Database initialization completed successfully!");
