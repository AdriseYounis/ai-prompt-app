// Connect to admin database first to set up authentication
db = db.getSiblingDB("admin");

// Create the admin user if it doesn't exist
if (db.getUser("admin") == null) {
  db.createUser({
    user: "admin",
    pwd: "password123",
    roles: [
      { role: "userAdminAnyDatabase", db: "admin" },
      { role: "dbAdminAnyDatabase", db: "admin" },
      { role: "readWriteAnyDatabase", db: "admin" },
    ],
  });
  print("✅ Admin user created successfully");
} else {
  print("ℹ️ Admin user already exists");
}

// Switch to the application database
db = db.getSiblingDB("ai_prompt_app");

// Create application-specific user with appropriate permissions
if (db.getUser("ai_prompt_user") == null) {
  db.createUser({
    user: "ai_prompt_user",
    pwd: "ai_prompt_password",
    roles: [
      { role: "readWrite", db: "ai_prompt_app" },
      { role: "dbAdmin", db: "ai_prompt_app" },
    ],
  });
  print("✅ Application user created successfully");
} else {
  print("ℹ️ Application user already exists");
}

// Create required collections
print("📦 Creating collections...");
db.createCollection("prompts");
db.createCollection("users");
db.createCollection("settings");

// Add sample prompts
print("📝 Adding sample prompts...");
db.prompts.insertMany([
  {
    prompt: "What is artificial intelligence?",
    response:
      "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think like humans and mimic their actions. The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    prompt: "How do neural networks work?",
    response:
      "Neural networks are computing systems inspired by the biological neural networks that constitute animal brains. They consist of artificial neurons (or nodes) that can learn from and make decisions based on input data. Neural networks use interconnected layers of nodes to process information, with each layer transforming the data in some way before passing it to the next layer.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    prompt: "Explain machine learning in simple terms",
    response:
      "Machine learning is a way to teach computers to learn from data, without being explicitly programmed. Instead of writing code with specific instructions for every situation, we give the computer examples and let it figure out the patterns. It's like teaching a child by showing them examples rather than explaining every rule.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    prompt: "What's the difference between AI and machine learning?",
    response:
      "Artificial Intelligence (AI) is the broader concept of machines being able to carry out tasks in a way that we would consider 'smart'. Machine Learning is a specific subset of AI that trains a machine how to learn using data. So while all machine learning is AI, not all AI is machine learning.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

// Add a sample user (password123 hashed with bcrypt)
print("👤 Adding sample user...");
db.users.insertOne({
  username: "demo_user",
  email: "demo@example.com",
  password: "$2a$10$XiOl0IHGFYQDKrFCCnRhc.s8KLEzmgJQd1yYn1EXx7LlvEtBwz3Mm",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Add application settings
print("⚙️ Adding application settings...");
db.settings.insertOne({
  appName: "AI Prompt Application",
  maxPromptLength: 5000,
  defaultModel: "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 2048,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Create indexes for better performance
print("🔍 Creating indexes...");
db.prompts.createIndex({ prompt: "text" });
db.prompts.createIndex({ createdAt: -1 });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

print("✨ Database initialization completed successfully!");
