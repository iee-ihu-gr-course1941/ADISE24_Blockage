# File: backend/Dockerfile
FROM node:22-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy the rest of the application files
COPY . .

WORKDIR /usr/src/app/backend

# Install dependencies
RUN npm install

# Expose the application port
EXPOSE ${PORT:-3000}

# Run the backend server
CMD ["npm", "start"]
