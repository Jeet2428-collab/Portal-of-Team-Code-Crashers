#!/usr/bin/env bash
# Render deployment build script for Code Crashers Django backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --noinput
python manage.py migrate
