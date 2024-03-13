#!/bin/bash

# Define directories
REACT_APP_DIR="beer"
DEPLOY_DIR="deploy_gh_pages"

# Step 1: Build the React app
echo "Building React app..."
cd $REACT_APP_DIR || exit
yarn install
yarn build
cd ..

# Step 2: Prepare the 'gh-pages' directory
echo "Preparing deployment directory..."
rm -rf $DEPLOY_DIR
mkdir $DEPLOY_DIR

# Copy root directory contents to deployment directory
# Excluding node_modules, .git, and the React app source directory to avoid unnecessary files
rsync -av --progress ./ $DEPLOY_DIR --exclude node_modules --exclude .git --exclude $REACT_APP_DIR

# Copy the built React app to the deployment directory under 'beer'
cp -r $REACT_APP_DIR/build/* $DEPLOY_DIR/beer/

# Step 3: Deploy to gh-pages
echo "Deploying to gh-pages..."
gh-pages -d $DEPLOY_DIR

# Cleanup
echo "Cleaning up..."
rm -rf $DEPLOY_DIR

echo "Deployment successful!"
