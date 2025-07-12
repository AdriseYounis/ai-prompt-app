#!/bin/bash

# MongoDB initialization script for ai-prompt-app
# This script handles setting up MongoDB with proper authentication and data seeding

echo "Starting MongoDB setup process..."

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to start..."
sleep 5

# Create admin user
echo "Creating MongoDB admin user..."
mongo admin --host mongodb --port 27017 -u admin -p password123 --authenticationDatabase admin <<EOF
  db.createUser({
    user: "admin",
    pwd: "password123",
    roles: [
      { role: "userAdminAnyDatabase", db: "admin" },
      { role: "dbAdminAnyDatabase", db: "admin" },
      { role: "readWriteAnyDatabase", db: "admin" }
    ]
  });
EOF

# Create application database and user
echo "Creating application database and user..."
mongo ai_prompt_app --host mongodb --port 27017 -u admin -p password123 --authenticationDatabase admin <<EOF
  db.createUser({
    user: "ai_prompt_user",
    pwd: "ai_prompt_password",
    roles: [
      { role: "readWrite", db: "ai_prompt_app" },
      { role: "dbAdmin", db: "ai_prompt_app" }
    ]
  });

  // Create collections
  db.createCollection("prompts");
  db.createCollection("users");
  db.createCollection("settings");

  // Add sample prompts
  db.prompts.insertMany([
    {
      prompt: "What is artificial intelligence?",
      response: "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think like humans and mimic their actions. The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving.",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      prompt: "How do neural networks work?",
      response: "Neural networks are computing systems inspired by the biological neural networks that constitute animal brains. They consist of artificial neurons (or nodes) that can learn from and make decisions based on input data. Neural networks use interconnected layers of nodes to process information, with each layer transforming the data in some way before passing it to the next layer.",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      prompt: "Explain machine learning in simple terms",
      response: "Machine learning is a way to teach computers to learn from data, without being explicitly programmed. Instead of writing code with specific instructions for every situation, we give the computer examples and let it figure out the patterns. It's like teaching a child by showing them examples rather than explaining every rule.",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  // Add a sample user
  db.users.insertOne({
    username: "demo_user",
    email: "demo@example.com",
    password: "\$2a\$10\$XiOl0IHGFYQDKrFCCnRhc.s8KLEzmgJQd1yYn1EXx7LlvEtBwz3Mm", // hashed "password123"
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Create indexes for better performance
  db.prompts.createIndex({ prompt: "text" });
  db.users.createIndex({ email: 1 }, { unique: true });
  db.users.createIndex({ username: 1 }, { unique: true });
EOF

# Verify database is set up correctly
echo "Verifying database setup..."
mongo ai_prompt_app --host mongodb --port 27017 -u ai_prompt_user -p ai_prompt_password --authenticationDatabase ai_prompt_app <<EOF
  const collections = db.getCollectionNames();
  print("Available collections:");
  collections.forEach(c => print(" - " + c));

  const promptCount = db.prompts.count();
  print("Number of prompts: " + promptCount);

  const userCount = db.users.count();
  print("Number of users: " + userCount);
EOF

echo "MongoDB setup completed successfully!"
