# TwinMaker Configurator

A Flask application that uses Google's Gemini AI to generate AWS IoT TwinMaker configurations from natural language descriptions.

## Features

- Natural language to TwinMaker configuration generation
- Support for Workspace, Component Types, Entities, Assets, Scene, and Relationships configurations
- Toggle between mock data and actual Gemini API calls
- Detailed execution logs for provisioning steps

## Installation

### Windows

1. Clone the repository
2. Navigate to the project directory
3. Run the installation script:
   ```
   .\install.ps1
   ```

### Manual Installation (All Platforms)

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Configure the environment variables in `.env`:
   - Get your Gemini API key from https://makersuite.google.com/app/apikey
   - Set `GEMINI_API_KEY=your_api_key_here`
   - Set `USE_MOCK_DATA=False` to use real API calls (or `True` for mock data)

## Usage

1. Start the Flask server:
   ```
   python app.py
   ```

2. Open your web browser to http://localhost:5000

3. Enter a natural language description of your factory and click "Generate TwinMaker Configuration"

4. View the generated configurations and execution logs

## Examples

Example factory description:
```
Our manufacturing facility has 3 CNC machines in the production area, 2 conveyor belts for material handling, and a quality control station. The machines are monitored for temperature, vibration, and operational status. We need to track production throughput and machine health metrics.
```

## Troubleshooting

- **GEMINI_API_KEY not working**: Ensure you've obtained a valid API key and properly set it in the `.env` file
- **ImportError: No module named google.generativeai**: Run `pip install google-generativeai`
- **JSON parsing errors**: Check that Gemini is returning properly formatted JSON; try adjusting the temperature parameter

## Development

- To modify the system prompt for Gemini, edit the `system_prompt` variable in the `call_gemini_llm` function
- To add additional provisioning scripts, place them in the `scripts/` directory and update the execution plan in `app.py`

## License

This project is licensed under the MIT License - see the LICENSE file for details. 