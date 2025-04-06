# TwinGenius - AWS IoT TwinMaker Configurator

TwinGenius is a powerful web application that transforms natural language descriptions of factories and manufacturing facilities into complete AWS IoT TwinMaker configurations using Google's Gemini AI.

![TwinGenius Logo](static/img/logo.png)

## Features

- **Natural Language Input**: Describe your factory in plain English - no technical specifications or JSON knowledge required
- **AI-Powered Configuration**: Google's Gemini AI analyzes your description and generates all required AWS configurations
- **Complete Twin Setup**: Automatically generates all components needed for a functional digital twin:
  - Workspace configuration
  - Component types with properties and data models
  - Entities representing physical objects
  - Assets with hierarchies and properties
  - Scene setup for 3D visualization
  - Relationship definitions between entities
- **Syntax-Highlighted Output**: Clean, readable JSON configurations with syntax highlighting
- **Raw LLM Access**: View and copy the raw Gemini AI output for customization or analysis
- **Interactive UI**: Clear, modern interface with visual diagrams explaining the digital twin architecture
- **Provisioning Scripts**: Ready-to-use scripts that can be executed to create your digital twin in AWS

## Architecture

TwinGenius consists of:

- **Frontend**: HTML/CSS/JavaScript with Bootstrap 5 for responsive design
- **Backend**: Python Flask application handling API requests
- **AI Integration**: Google Gemini API for natural language processing and configuration generation
- **Visualization**: D3.js for interactive component relationship diagrams

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

3. Enter a detailed description of your factory in the input form. Include information about:
   - Equipment and machines
   - Sensors and monitoring capabilities
   - Factory layout and areas
   - Material flow and processes
   - Key metrics you want to track

4. Click "Build Factory Twin" to generate your digital twin configuration

5. Review the configurations in the tabbed output area:
   - Execution Logs: Process details and status updates
   - Raw LLM Output: The complete JSON response from Gemini AI
   - Component-specific tabs (Workspace, Component Types, etc.): Individual configuration sections

6. Copy the configurations or use the provided scripts to deploy your digital twin to AWS IoT TwinMaker

## Example Descriptions

Try these sample descriptions for testing:

```
Our automotive assembly plant has 5 robotic welding stations, 3 paint booths, and 2 quality inspection areas. Each welding robot has temperature, position, and power consumption sensors. The paint booths monitor air quality, paint levels, and booth temperature. We track vehicles through RFID tags as they move through the assembly line on conveyor systems.
```

```
Our food processing facility has 3 mixing tanks, 2 packaging lines, and a cold storage area. The mixing tanks have agitator speed, temperature, and fill level sensors. The packaging lines track throughput, package weight, and seal integrity. The cold storage area monitors temperature and humidity at 5 different points. We need to optimize energy usage and ensure food safety compliance.
```

## Troubleshooting

- **GEMINI_API_KEY not working**: Ensure you've obtained a valid API key and properly set it in the `.env` file
- **ImportError: No module named google.generativeai**: Run `pip install google-generativeai`
- **JSON parsing errors**: Check that Gemini is returning properly formatted JSON; try adjusting the prompt parameters
- **Visualization not loading**: Ensure JavaScript is enabled in your browser and check the console for errors

## Development

- **Backend (app.py)**: Contains the Flask routes and Gemini AI integration
- **Frontend (templates/index.html)**: Main application interface
- **Styling (static/css/style.css)**: Custom CSS for application styling
- **Client-side Logic (static/js/main.js)**: JavaScript handling UI interactions
- **Visualizations (static/js/diagram.js)**: D3.js diagrams for component relationships

To modify the system prompt for Gemini, edit the `system_prompt` variable in the `call_gemini_llm` function in app.py.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [AWS IoT TwinMaker](https://aws.amazon.com/iot-twinmaker/)
- [Google Gemini AI](https://ai.google.dev/models/gemini)
- [Flask](https://flask.palletsprojects.com/)
- [Bootstrap](https://getbootstrap.com/)
- [Prism.js](https://prismjs.com/)
- [D3.js](https://d3js.org/) 