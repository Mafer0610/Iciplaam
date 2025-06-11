@echo off
start msedge "http://localhost:5000"
start /min cmd /c "node server.js"
