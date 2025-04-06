# app.py
import os
import json
import subprocess
import sys
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv() # Load environment variables from .env file
# IMPORTANT: Configure your actual Gemini API Key securely
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")
SCRIPT_DIRECTORY = os.path.join(os.path.dirname(__file__), "scripts")
PYTHON_EXECUTABLE = sys.executable # Use the same python interpreter running Flask
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "True").lower() in ("true", "1", "t")  # Set to False for actual API calls

# --- Flask App Setup ---
app = Flask(__name__)

# --- Helper Functions ---

def call_gemini_llm(factory_description: str) -> tuple[dict, str]:
    """
    Calls the Gemini LLM API or returns mock data based on USE_MOCK_DATA flag.
    Returns tuple of (processed_json, raw_response)
    """
    print(f"--- Calling Gemini LLM (Mock: {USE_MOCK_DATA}) ---")
    print(f"Factory Description:\n{factory_description[:200]}...\n")  # Print snippet

    if USE_MOCK_DATA:
        print("--- Using Dummy JSON Data ---")
        return generate_dummy_json(), json.dumps(generate_dummy_json(), indent=2)

    # --- Actual Gemini API Call Implementation ---
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash')  # Or appropriate model
        
        system_prompt = """
        You are an expert AWS IoT TwinMaker configuration generator. Based on the user's
        natural language description of their factory, generate the necessary JSON
        configurations for Workspace, Component Types, Entities, Assets, Scene, and
        Relationships (Connections). Output EACH configuration as a distinct JSON object
        within a main JSON structure keyed by: 'workspace', 'componentTypes', 'entities',
        'assets', 'scene', 'connections'. Ensure JSON is valid.
        
        Example structure:
        {
            "workspace": { ... workspace JSON ... },
            "componentTypes": [ { ... component type 1 ... }, { ... component type 2 ... } ],
            "entities": [ { ... entity 1 ... }, { ... entity 2 ... } ],
            "assets": [ { ... asset 1 ... }, { ... asset 2 ... } ],
            "scene": { ... scene JSON ... },
            "connections": [ { ... relationship 1 ... }, { ... relationship 2 ... } ]
        }
        
        Focus on creating a functional and logical representation of the described factory.
        """
        
        response = model.generate_content(
            contents=[
                {"role": "user", "parts": [factory_description]},
                {"role": "model", "parts": [{"text": system_prompt}]}
            ],
            generation_config=genai.types.GenerationConfig(
                temperature=0.3
            )
        )
        
        # Store the raw response
        raw_response = response.text
        print(f"Raw Gemini response received: {len(raw_response)} characters")
        
        # Clean potential markdown fences
        json_str = raw_response
        if "```json" in json_str:
            json_parts = json_str.split("```json")
            if len(json_parts) > 1:
                json_str = json_parts[1]
        if "```" in json_str:
            json_parts = json_str.split("```")
            json_str = json_parts[0]
        
        # Remove any leading/trailing non-JSON content
        json_str = json_str.strip()
        
        # Try to find the start and end of the JSON object
        start_idx = json_str.find('{')
        end_idx = json_str.rfind('}') + 1
        if start_idx >= 0 and end_idx > start_idx:
            json_str = json_str[start_idx:end_idx]
        
        # Parse the JSON
        gemini_output = json.loads(json_str)
        
        print("--- Gemini LLM Call Successful ---")
        
        # Validate that all required keys are present
        required_keys = ["workspace", "componentTypes", "entities", "assets", "scene", "connections"]
        missing_keys = [key for key in required_keys if key not in gemini_output]
        
        if missing_keys:
            print(f"Warning: Missing required keys in Gemini response: {missing_keys}")
            # Add missing keys with empty values
            for key in missing_keys:
                gemini_output[key] = [] if key in ["componentTypes", "entities", "assets", "connections"] else {}
        
        return gemini_output, raw_response
        
    except Exception as e:
        print(f"--- Gemini LLM Call Failed: {str(e)} ---")
        print("Falling back to dummy data")
        dummy_data = generate_dummy_json()
        return dummy_data, json.dumps(dummy_data, indent=2)


def generate_dummy_json():
    """Generates placeholder JSON data for UI testing."""
    return {
        "workspace": {"workspaceId": "FactoryWorkspace", "description": "Main factory digital twin workspace", "s3Bucket": "my-factory-twinmaker-bucket", "role": "arn:aws:iam::123456789012:role/TwinMakerRole"},
        "componentTypes": [
            {"componentTypeId": "MachineStatus", "description": "Tracks machine operational status", "propertyDefinitions": {"status": {"dataType": {"type": "STRING"}, "defaultValue": "UNKNOWN"}}},
            {"componentTypeId": "TemperatureSensor", "description": "Reads temperature", "propertyDefinitions": {"tempC": {"dataType": {"type": "DOUBLE"}, "isTimeSeries": True}}}
        ],
        "entities": [
            {"entityId": "Machine_001", "entityName": "Press Machine 1", "components": {"MachineStatus": {}, "TemperatureSensor": {}}},
            {"entityId": "Machine_002", "entityName": "CNC Machine 2", "components": {"MachineStatus": {}}}
        ],
        "assets": [
            {"assetId": "PressAsset_001", "assetName": "Press Machine Asset", "assetModelId": "PressModel", "hierarchies": [], "properties": []}
        ],
        "scene": {"sceneId": "FactoryFloor", "contentLocation": "s3://my-factory-twinmaker-bucket/scenes/factory.glb", "description": "3D view of the factory floor"},
        "connections": [
            {"sourceEntityId": "Machine_001", "targetEntityId": "FactoryFloor", "relationshipName": "locatedIn"},
        ]
    }

def run_provisioning_script(script_name: str, json_data: dict | list) -> tuple[bool, str]:
    """
    Runs a specific Python provisioning script located in the SCRIPT_DIRECTORY.
    Passes JSON data via a temporary file.
    Returns (success_status, combined_output_log).
    """
    script_path = os.path.join(SCRIPT_DIRECTORY, script_name)
    if not os.path.exists(script_path):
        error_msg = f"Error: Script not found at {script_path}"
        print(error_msg)
        return False, error_msg

    json_file_path = None
    log_output = ""
    success = False

    try:
        # Create a temporary file for JSON input
        temp_file_name = f"temp_{script_name.split('.')[0]}_data.json"
        json_file_path = os.path.join(SCRIPT_DIRECTORY, temp_file_name)
        with open(json_file_path, 'w') as f:
            json.dump(json_data, f, indent=2)

        log_output += f"--- Running Script: {script_name} ---\n"
        log_output += f"Using input file: {json_file_path}\n"
        print(f"Executing: {PYTHON_EXECUTABLE} {script_path} {json_file_path}")

        # Execute the script
        process = subprocess.run(
            [PYTHON_EXECUTABLE, script_path, json_file_path],
            capture_output=True,
            text=True,
            check=False, # Don't raise exception on non-zero exit code
            cwd=SCRIPT_DIRECTORY # Run script from its directory if needed
        )

        log_output += f"Exit Code: {process.returncode}\n"
        if process.stdout:
            log_output += "--- stdout ---\n"
            log_output += process.stdout + "\n"
        if process.stderr:
            log_output += "--- stderr ---\n"
            log_output += process.stderr + "\n"

        success = (process.returncode == 0)
        log_output += f"--- Script {script_name} {'Completed Successfully' if success else 'Failed'} ---\n\n"
        print(f"Script {script_name} finished. Success: {success}")

    except Exception as e:
        error_msg = f"Error executing script {script_name}: {e}\n"
        print(error_msg)
        log_output += error_msg
        success = False
    finally:
        # Clean up the temporary JSON file
        if json_file_path and os.path.exists(json_file_path):
            try:
                os.remove(json_file_path)
                print(f"Removed temporary file: {json_file_path}")
            except OSError as e:
                print(f"Error removing temporary file {json_file_path}: {e}")
                log_output += f"Warning: Could not remove temporary file {json_file_path}\n"


    return success, log_output.strip()

# --- API Routes ---

@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html')

@app.route('/api/build-full-twin', methods=['POST'])
def build_full_twin():
    """
    API endpoint to receive factory description, call LLM, run scripts,
    and return status, JSONs, and logs.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    factory_description = data.get('description')

    if not factory_description:
        return jsonify({"error": "Missing 'description' in request body"}), 400

    # 1. Call Gemini LLM
    try:
        gemini_json_response, raw_llm_response = call_gemini_llm(factory_description)
        if not all(k in gemini_json_response for k in ["workspace", "componentTypes", "entities", "assets", "scene", "connections"]):
             # Basic validation - enhance as needed based on Gemini's actual output structure
             raise ValueError("LLM response did not contain all required keys.")
    except Exception as e:
        print(f"Error during LLM call or parsing: {e}")
        return jsonify({
            "status": "error",
            "message": f"Failed to get or parse valid configuration from LLM: {e}",
            "logs": f"LLM Error: {e}",
            "gemini_json": None, # Or include partial/raw response if available
            "raw_llm_response": None,
            "step_status": {}
        }), 500

    # 2. Define script execution order
    script_execution_plan = [
        {"key": "workspace", "script": "setup_workspace.py", "data": gemini_json_response.get("workspace", {})},
        {"key": "componentTypes", "script": "setup_component_types.py", "data": gemini_json_response.get("componentTypes", [])},
        {"key": "entities", "script": "setup_entities.py", "data": gemini_json_response.get("entities", [])},
        {"key": "assets", "script": "setup_assets.py", "data": gemini_json_response.get("assets", [])},
        {"key": "scene", "script": "setup_scene.py", "data": gemini_json_response.get("scene", {})},
        {"key": "connections", "script": "setup_connections.py", "data": gemini_json_response.get("connections", [])},
    ]

    # 3. Execute Scripts Sequentially and Collect Logs/Status
    execution_logs = ""
    step_status = {}
    overall_success = True

    for step in script_execution_plan:
        print(f"\n--- Starting Step: {step['key']} ---")
        if step['data']: # Only run script if data exists for it
            success, log = run_provisioning_script(step['script'], step['data'])
            step_status[step['key']] = "success" if success else "failed"
            execution_logs += log + "\n\n"
            if not success:
                overall_success = False
                # Decide if you want to stop on first failure or run all scripts
                # break # Uncomment to stop on first failure
        else:
             log_msg = f"--- Skipping Step: {step['key']} (No data provided by LLM) ---\n\n"
             print(log_msg)
             execution_logs += log_msg
             step_status[step['key']] = "skipped"


    # 4. Prepare and return the final response
    final_status = "success" if overall_success else "error"
    final_message = "TwinMaker environment configuration process completed."
    if not overall_success:
        final_message = "TwinMaker environment configuration process completed with errors. Check logs for details."

    return jsonify({
        "status": final_status,
        "message": final_message,
        "step_status": step_status,
        "gemini_json": gemini_json_response,
        "raw_llm_response": raw_llm_response,
        "logs": execution_logs.strip()
    })

# --- Main Execution ---
if __name__ == '__main__':
    # Use Waitress for production on Windows instead of Flask's dev server
    # Run `pip install waitress` then use `waitress-serve --host=0.0.0.0 --port=5000 app:app`
    # For development:
    app.run(debug=True, host='0.0.0.0') # Listen on all interfaces for easier access