#!/bin/bash
# Gemini CLI Heartbeat Script for Mission Control
# Run this in parallel with Gemini CLI to keep the agent connected

API_KEY="sk_mc_049b28a847468ec7348f014f0a00966d"
AGENT_ID="1"
CONNECTION_ID="8c3d8285-46d4-49a8-b898-47d7c7d3bbce"
MC_URL="http://localhost:3000"

echo "Starting Gemini CLI heartbeat..."
echo "Agent ID: $AGENT_ID"
echo "Connection ID: $CONNECTION_ID"
echo "Press Ctrl+C to stop"
echo ""

while true; do
  RESPONSE=$(curl -s -X POST "$MC_URL/api/agents/$AGENT_ID/heartbeat" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{
      \"connection_id\": \"$CONNECTION_ID\"
    }")

  # Check response status
  if echo "$RESPONSE" | grep -q "HEARTBEAT_OK"; then
    if echo "$RESPONSE" | grep -q "No work items"; then
      echo "[$(date '+%H:%M:%S')] ✓ Heartbeat OK - No work items"
    else
      echo "[$(date '+%H:%M:%S')] ✓ Heartbeat OK - Work items available!"
      echo "$RESPONSE"
    fi
  else
    echo "[$(date '+%H:%M:%S')] ✗ Heartbeat failed: $RESPONSE"
  fi

  # Wait 30 seconds before next heartbeat
  sleep 30
done
