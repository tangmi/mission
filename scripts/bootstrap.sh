#!/bin/sh

#
# Install all the base software
#

INSTALL_COMMAND="apt-get -y install"
# INSTALL_COMMAND="apt-get -y -qq install"
UPDATE_COMMAND="apt-get -qq update"

MCC_HOME=/var/local/mcc
MCC_LOGS=/var/log/mcc
NGINX_HOME=/etc/nginx

# Because everybody does this
$UPDATE_COMMAND

# Install ssh server
echo "Installing openssh-server"
apt-get install openssh-server

# Install node.js
echo "Installing node.js and friends"
echo " => installing node.js friends"
$INSTALL_COMMAND python-software-properties python g++ make
echo " => adding node.js repository"
add-apt-repository -y ppa:chris-lea/node.js
$UPDATE_COMMAND
echo " => installing node.js"
$INSTALL_COMMAND nodejs

# Symlink /usr/bin/nodejs to /usr/bin/node
# echo " => symlinking /usr/bin/nodejs to /usr/bin/node"
# rm /usr/bin/node
# ln -s /usr/bin/nodejs /usr/bin/node

# Install git
echo "Installing git-core"
$INSTALL_COMMAND git-core

# Configure git
echo " => configuring git"
touch ~/.gitconfig
git config --global user.name "mcc-server"
git config --global user.email mcc@conceptquanta.com

# set up git user
adduser git
date +%s | md5sum | base64 | head -c 32 | passwd git --stdin
mkdir /var/www
chown -R git /var/www
chmod -R g+ws /var/www

#set up git repo hooks
# for all repos,
#	REPO_NAME="test"
#	REPO_DIR="/home/git/$REPO_NAME.git"
#	mkdir $REPO_DIR
#	cd $REPO_DIR
#	git --bare init
#	rm -rf $REPO_DIR/hooks
#	ln -s ~/hooks $REPO_DIR/hooks
#	echo "git clone git@tangmi.co:$REPO_NAME.git"

mkdir ~/hooks
cat >> ~/hooks/post-receive <<EOF
#!/bin/bash

reponame=$(basename "$PWD")
reponame=${reponame%.git}
docroot=/var/www/$reponame #`mcc config path.deploy`/$reponame

echo "Cleaning $docroot"
rm -rf $docroot
mkdir $docroot
echo "Unpacking repo to $docroot"
GIT_WORK_TREE=$docroot git checkout -f

echo "Done"

exit 1

EOF


#restrict git user access?

# setup ssh keys: cat /tmp/id_rsa.pub >> ~/.ssh/authorized_keys
#add command in mcc to upload rsa key


# Install nginx
echo "Installing nginx"
$INSTALL_COMMAND nginx
echo " => starting nginx"
#setup permissions for sites-available and site-enabled so git can get it
# rm $NGINX_HOME/sites-enabled/default
# rm $NGINX_HOME/sites-available/default
service nginx start

