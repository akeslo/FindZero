# FindZero - MD Cleaner

An [Obsidian](https://obsidian.md) plugin that helps you identify and clean up blank or empty notes in your vault. This plugin is perfect for maintaining a clean vault by easily finding and removing notes that only contain a title without any content.

## Features

- 🔍 Scans your vault for blank notes (notes with only a title and no content)
- 📋 Displays a clear list of blank notes with their titles and paths
- ✨ Interactive UI with the following capabilities:
  - Click on note titles to preview them
  - Individual delete buttons for each note
  - Batch selection and deletion of multiple notes
  - "Select All" option for quick bulk operations

## Installation

### From within Obsidian

1. Open Settings > Community plugins
2. Make sure Safe mode is off
3. Click Browse community plugins
4. Search for "FindZero - MD Cleaner"
5. Click Install
6. Once installed, close the community plugins window and activate the plugin

### Manual Installation

1. Download `main.js` and `manifest.json` from the latest release
2. Copy these files to your vault's `.obsidian/plugins/find-zero-md-cleaner/` directory
3. Open Obsidian and enable the plugin in Settings > Community plugins

## Usage

1. Click the broom icon in the left ribbon, or
2. Use the command palette (Ctrl/Cmd + P) and search for "Scan & Delete Blank Notes"

### Working with the Plugin

1. When opened, the plugin scans your vault for blank notes
2. Blank notes are displayed in a list with their titles and paths
3. For each note, you can:
   - Click the title to open and preview the note
   - Use the "Open" button to open in the current pane
   - Delete individual notes using the "Delete" button
   - Select multiple notes using checkboxes for batch deletion

### Batch Operations

1. Use individual checkboxes to select specific notes
2. Use "Select All" to select all blank notes
3. Click "Delete Selected" to remove all selected notes at once
4. A confirmation message will show how many notes were deleted

## Support

If you encounter any issues or have suggestions for improvements, please:

1. Check the [GitHub Issues](https://github.com/yourusername/find-zero-md-cleaner/issues) page
2. Create a new issue if your problem hasn't been reported

## Development

This plugin is built using TypeScript and the Obsidian API.

### Building from Source

1. Clone this repository
2. Install dependencies with `npm install`
3. Build the plugin with `npm run build`
4. Copy `main.js` and `manifest.json` and `styles.css` to your test vault's plugins folder

### Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.