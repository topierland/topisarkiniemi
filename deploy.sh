#!/bin/bash

# Define directories
REACT_APP_DIR="beer"
DEPLOY_DIR="deploy_gh_pages"

# Ensure script stops at the first error
set -e

# Step 1: Build the React app
echo "Building React app..."
cd $REACT_APP_DIR
yarn install || { echo "Failed to install dependencies."; exit 1; }
yarn build || { echo "React app build failed."; exit 1; }
cd ..

# Step 2: Prepare the 'gh-pages' directory
echo "Preparing deployment directory..."
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/$REACT_APP_DIR

# Copy root directory contents to deployment directory
# Excluding node_modules, .git, the React app source directory, and deploy directory to avoid unnecessary files
rsync -av --progress ./ $DEPLOY_DIR --exclude node_modules --exclude .git --exclude $REACT_APP_DIR --exclude $DEPLOY_DIR || { echo "Failed to copy project files."; exit 1; }

# Copy the built React app to the deployment directory under 'beer'
cp -r $REACT_APP_DIR/build/* $DEPLOY_DIR/$REACT_APP_DIR/ || { echo "Failed to copy built React app."; exit 1; }

# Include the CNAME file in the deployment directory, if it exists
if [ -f CNAME ]; then
    cp CNAME $DEPLOY_DIR/ || { echo "Failed to copy CNAME file."; exit 1; }
fi

# Step 3: Deploy to gh-pages
echo "Deploying to gh-pages..."
gh-pages -d $DEPLOY_DIR || { echo "Deployment failed."; exit 1; }

# Cleanup
echo "Cleaning up..."
rm -rf $DEPLOY_DIR

echo "Deployment successful!"

