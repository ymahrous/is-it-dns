#!/bin/sh
# Fill in your GitHub username and display name across the site.
# Usage: ./configure.sh your-github-username "Your Name"
set -e
[ -n "$1" ] && [ -n "$2" ] || { echo 'Usage: ./configure.sh your-github-username "Your Name"'; exit 1; }
USER="$1" NAME="$2" perl -pi -e 's/YOUR-USERNAME/$ENV{USER}/g; s/YOUR-NAME/$ENV{NAME}/g' \
  index.html 404.html robots.txt sitemap.xml llms.txt README.md CONTRIBUTING.md LICENSE
echo "Done. Site URL: https://$1.github.io/is-it-dns/"
