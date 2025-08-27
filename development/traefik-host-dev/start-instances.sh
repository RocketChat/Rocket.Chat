#!/bin/bash

# Script to help start multiple Rocket.Chat instances for load balancing testing
# Usage: ./start-instances.sh [number_of_instances]

set -e

# Default number of instances
INSTANCES=${1:-2}
BASE_PORT=3000

echo "🚀 Starting $INSTANCES Rocket.Chat instances for load balancing testing"
echo "📍 Base port: $BASE_PORT"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script should be run from the Rocket.Chat project root directory"
    echo "   Make sure you're in the directory containing package.json"
    exit 1
fi

# Function to start an instance
start_instance() {
    local instance_num=$1
    local port=$((BASE_PORT + instance_num - 1))
    
    if [ $instance_num -eq 1 ]; then
        port=$BASE_PORT  # First instance uses the base port
    else
        port=$((BASE_PORT + instance_num))  # Subsequent instances use incremented ports
    fi
    
    echo "🔧 Starting Rocket.Chat instance $instance_num on port $port"
    
    # Create a new terminal session for each instance
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal --title="Rocket.Chat Instance $instance_num (Port $port)" -- bash -c "
            echo 'Starting Rocket.Chat instance $instance_num on port $port';
            echo 'Press Ctrl+C to stop this instance';
            echo '';
            PORT=$port ROOT_URL=http://localhost:$port yarn dev;
            echo 'Instance $instance_num stopped. Press Enter to close this terminal.';
            read
        "
    elif command -v osascript &> /dev/null; then
        # macOS Terminal
        osascript -e "
            tell application \"Terminal\"
                do script \"cd $(pwd) && echo 'Starting Rocket.Chat instance $instance_num on port $port' && PORT=$port ROOT_URL=http://localhost:$port yarn dev\"
            end tell
        "
    else
        echo "⚠️  Could not detect terminal application. Please start instance $instance_num manually:"
        echo "   PORT=$port ROOT_URL=http://localhost:$port yarn dev"
    fi
    
    # Wait a bit between starting instances
    sleep 2
}

# Start instances
for i in $(seq 1 $INSTANCES); do
    start_instance $i
done

echo ""
echo "✅ Started $INSTANCES Rocket.Chat instances"
echo ""
echo "📋 Instance Information:"
for i in $(seq 1 $INSTANCES); do
    if [ $i -eq 1 ]; then
        port=$BASE_PORT
    else
        port=$((BASE_PORT + i))
    fi
    echo "   Instance $i: http://localhost:$port"
done

echo ""
echo "🔧 Next Steps:"
echo "1. Wait for all instances to start completely"
echo "2. Update development/traefik-host-dev/config/rocketchat.yml to include all instances"
echo "3. Start Traefik: cd development/traefik-host-dev && docker-compose up -d"
echo "4. Access load-balanced application at: http://localhost:3000"
echo "5. View Traefik dashboard at: http://localhost:8080"
echo ""
echo "💡 Tip: Check the 'rocketchat-server' cookie in your browser to see which instance you're connected to"