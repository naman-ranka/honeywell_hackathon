# scripts/setup_workspace.py
import sys
import json
import time
import random

print("--- Starting Workspace Setup Script ---")

if len(sys.argv) < 2:
    print("Error: JSON file path argument required.", file=sys.stderr)
    sys.exit(1)

json_file_path = sys.argv[1]
print(f"Received args: {sys.argv}")
print(f"Attempting to read workspace config from: {json_file_path}")

try:
    with open(json_file_path, 'r') as f:
        data = json.load(f)
    print("Successfully loaded workspace JSON data:")
    print(json.dumps(data, indent=2))

    # Simulate AWS API calls
    print("\nSimulating AWS API Call: Checking if workspace exists...")
    time.sleep(random.uniform(0.5, 1.5))
    workspace_id = data.get('workspaceId', 'UnknownWorkspace')

    if random.choice([True, False]): # Simulate pre-existing workspace sometimes
         print(f"Workspace '{workspace_id}' already exists. Skipping creation.")
    else:
        print(f"Simulating AWS API Call: Creating TwinMaker Workspace '{workspace_id}'...")
        time.sleep(random.uniform(1, 3))
        print(f"Workspace '{workspace_id}' created successfully (Simulated).")

    # Simulate success/failure randomly for demonstration
    if random.random() < 0.9: # 90% chance of success
        print("\n--- Workspace Setup Script Completed Successfully ---")
        sys.exit(0) # Success
    else:
        print("\nError: Failed to configure workspace roles (Simulated Error).", file=sys.stderr)
        print("--- Workspace Setup Script Failed ---", file=sys.stderr)
        sys.exit(1) # Failure

except FileNotFoundError:
    print(f"Error: JSON file not found at {json_file_path}", file=sys.stderr)
    sys.exit(1)
except json.JSONDecodeError:
     print(f"Error: Invalid JSON in file {json_file_path}", file=sys.stderr)
     sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred: {e}", file=sys.stderr)
    sys.exit(1)