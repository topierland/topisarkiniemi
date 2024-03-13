#!/bin/bash

# Define directories
REACT_APP_DIR="beer"
DEPLOY_DIR="deploy_gh_pages"

# Function to handle errors
error_exit()
{
	echo "$1" 1>&2
	exit 1
}

# Ensure the script is run from the project root
if [[ ! -d "$REACT_APP_DIR" || ! -f "CNAME" ]]; then
    error_exit "Please run this script from the project root and ensure the CNAME file exists."
fi

# Step 1: Build the React app
echo "Building React app..."
cd $REACT_APP_DIR || error_exit "Failed to enter React app directory."
yarn install || error_exit "Yarn install failed."
yarn build || error_exit "React app build failed."
cd .. || error_exit "Failed to return to project root."

# Step 2: Prepare the 'gh-pages' directory
echo "Preparing deployment directory..."
rm -rf $DEPLOY_DIR || error_exit "Failed to clean deployment directory."
mkdir $DEPLOY_DIR || error_exit "Failed to create deployment directory."

# Copy root directory contents to deployment directory
# Excluding node_modules, .git, .github, and the React app source directory to avoid unnecessary files
rsync -av --progress ./ $DEPLOY_DIR --exclude node_modules --exclude .git --exclude .github --exclude $REACT_APP_DIR || error_exit "Failed to copy project to deployment directory."

# Copy the built React app to the deployment directory under 'beer'
cp -r $REACT_APP_DIR/build/* $DEPLOY_DIR/beer/ || error_exit "Failed to copy built React app."

# Ensure CNAME is copied to preserve custom domain configuration
cp CNAME $DEPLOY_DIR/ || error_exit "Failed to copy CNAME file."

# Step 3: Deploy to gh-pages
echo "Deploying to gh-pages..."
gh-pages -d $DEPLOY_DIR || error_exit "Deployment failed."

# Cleanup
echo "Cleaning up..."
rm -rf $DEPLOY_DIR || error_exit "Failed to clean up deployment directory."

echo "Deployment successful!"
