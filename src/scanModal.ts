import { App, Modal, Notice, TFile } from 'obsidian';

interface FileSnippet {
    file: TFile;
    title: string;
    contentLength: number;
    selected: boolean;
}

interface MDCleanerSettings {
	debugOutput: boolean;
	runAtStartup: boolean;
	journalTemplate: string;
}

export class ScanModal extends Modal {
    private fileSnippets: FileSnippet[] = [];
    private selectedCount: number = 0;
    private batchDeleteButtonEl: HTMLButtonElement;
    private settings: MDCleanerSettings;

    constructor(app: App, settings: MDCleanerSettings) {
        super(app);
        this.settings = settings;
    }

    onOpen() {
        this.scanVaultFiles();
    }

    private isUnfilledJournalTemplate(content: string): boolean {
        if (!this.settings.journalTemplate || this.settings.journalTemplate.trim() === '') {
            return false;
        }

        // Normalize whitespace for comparison
        const normalizeWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();
        
        const normalizedContent = normalizeWhitespace(content);
        const normalizedTemplate = normalizeWhitespace(this.settings.journalTemplate);
        
        if (this.settings.debugOutput) {
            console.log('Comparing content:', normalizedContent);
            console.log('With template:', normalizedTemplate);
        }
        
        return normalizedContent === normalizedTemplate;
    }

    async scanVaultFiles() {
        const { contentEl } = this;
        
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Scanning for blank notes...' });
        
        // Get all markdown files in the vault
        const markdownFiles = this.app.vault.getMarkdownFiles();
        
        // Add a loading indicator
        const loadingDiv = contentEl.createDiv({ cls: 'loading' });
        loadingDiv.createSpan({ text: 'Reading files...' });
        
        // Process files and get snippets
        this.fileSnippets = [];
        let processedCount = 0;
        let blankFilesCount = 0;
        
        for (const file of markdownFiles) {
            try {
                const content = await this.app.vault.read(file);
                const lines = content.split('\n');
                
                // Extract the first line as title
                const title = lines.length > 0 ? lines[0].trim() : file.basename;
                
                // Remove the title line from the content assessment
                const contentWithoutTitle = lines.slice(1).join('\n').trim();
                const contentLength = contentWithoutTitle.length;
                
                // Count non-blank lines after the title line
                const nonBlankLines = lines.slice(1).filter(line => line.trim().length > 0).length;
                
                // Consider a file blank if there's essentially no content after the title line
                // OR if it matches the unfilled journal template
                const isBlank = contentLength === 0 || nonBlankLines === 0 || this.isUnfilledJournalTemplate(content);
                
                if (isBlank) {
                    this.fileSnippets.push({
                        file,
                        title,
                        contentLength,
                        selected: false
                    });
                    blankFilesCount++;
                }
                
                processedCount++;
                if (processedCount % 10 === 0) {
                    loadingDiv.setText(`Read ${processedCount} of ${markdownFiles.length} files... Found ${blankFilesCount} blank notes`);
                    // Small delay to allow UI to update
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            } catch (error) {
                console.error(`Error processing file ${file.path}:`, error);
            }
        }
        
        // Update UI with file snippets
        this.displayFileSnippets();
    }
    
    displayFileSnippets() {
        const { contentEl } = this;
        contentEl.empty();
        
        contentEl.createEl('h2', { text: 'Blank Notes' });
        
        if (this.fileSnippets.length === 0) {
            contentEl.createEl('p', { text: 'No blank notes found in your vault.' });
            return;
        }
        
        const description = contentEl.createEl('p');
        description.setText(`Found ${this.fileSnippets.length} blank notes. Select notes and use batch delete, or delete individually.`);
        
        // Create batch actions
        const batchActions = contentEl.createDiv({ cls: 'batch-actions' });
        
        const selectAllContainer = batchActions.createDiv({ cls: 'select-all-container' });
        
        // Create "Select All" with icon
        const selectAllIcon = selectAllContainer.createDiv({ 
            cls: 'selection-icon', 
            attr: { id: 'select-all-icon' }
        });
        selectAllIcon.setText('○'); // Empty circle by default
        
        // Add "Select All" label
        const selectAllLabel = selectAllContainer.createSpan({ text: 'Select All' });
        
        // Add click handler for both icon and label
        const selectAllClickHandler = () => {
            const isCurrentlySelected = selectAllIcon.hasClass('is-selected');
            const newSelectedState = !isCurrentlySelected;
            
            // Update visual state
            if (newSelectedState) {
                selectAllIcon.addClass('is-selected');
                selectAllIcon.setText('●'); // Filled circle
            } else {
                selectAllIcon.removeClass('is-selected');
                selectAllIcon.setText('○'); // Empty circle
            }
            
            // Update all file snippets
            this.fileSnippets.forEach(fs => fs.selected = newSelectedState);
            this.selectedCount = newSelectedState ? this.fileSnippets.length : 0;
            this.updateBatchDeleteButton();
            this.updateSelectionIcons();
        };
        
        selectAllIcon.addEventListener('click', selectAllClickHandler);
        selectAllLabel.addEventListener('click', selectAllClickHandler);
        
        // Create a standalone button for batch deletion instead of using Setting
        const batchActionsButtonContainer = batchActions.createDiv({ cls: 'batch-actions-button' });
        const batchDeleteButtonEl = batchActionsButtonContainer.createEl('button', {
            text: 'Delete Selected (0)',
            cls: 'mod-cta'
        });
        batchDeleteButtonEl.disabled = true;
        
        // Add click event listener to the batch delete button
        batchDeleteButtonEl.addEventListener('click', async () => {
            if (this.selectedCount === 0) return;
            
            const selectedFiles = this.fileSnippets.filter(fs => fs.selected);
            let deletedCount = 0;
            
            for (const fileSnippet of selectedFiles) {
                try {
                    await this.app.vault.delete(fileSnippet.file);
                    deletedCount++;
                } catch (error) {
                    new Notice(`Failed to delete ${fileSnippet.file.path}: ${error}`);
                }
            }
            
            new Notice(`Deleted ${deletedCount} files`);
            
            // Update the file list
            this.fileSnippets = this.fileSnippets.filter(fs => !fs.selected);
            this.selectedCount = 0;
            
            // Re-render the list
            this.displayFileSnippets();
        });
        
        // Store batch delete button reference for updates
        this.batchDeleteButtonEl = batchDeleteButtonEl;
        
        // Create a container for the file list
        const fileListContainer = contentEl.createDiv({ cls: 'file-list-container' });
        
        for (const fileSnippet of this.fileSnippets) {
            const fileItem = fileListContainer.createDiv({ cls: 'file-item' });
            
            // Add selection indicator (circle icon) for batch selection
            const selectionContainer = fileItem.createDiv({ cls: 'selection-indicator' });
            
            // Create selection circle with appropriate icon
            const selectionIcon = selectionContainer.createDiv({ cls: 'selection-icon' });
            // Set initial state
            if (fileSnippet.selected) {
                selectionIcon.addClass('is-selected');
                selectionIcon.setText('●');
            } else {
                selectionIcon.setText('○');
            }
            
            // Add click handler to toggle selection
            selectionContainer.addEventListener('click', () => {
                fileSnippet.selected = !fileSnippet.selected;
                
                // Update visual state
                if (fileSnippet.selected) {
                    selectionIcon.addClass('is-selected');
                    selectionIcon.setText('●');
                } else {
                    selectionIcon.removeClass('is-selected');
                    selectionIcon.setText('○');
                }
                
                this.selectedCount += fileSnippet.selected ? 1 : -1;
                this.updateBatchDeleteButton();
                
                // Update select all icon state
                this.updateSelectAllIcon();
            });
            
            const fileInfo = fileItem.createDiv({ cls: 'file-info' });
            
            // Create clickable title that opens the note
            const titleEl = fileInfo.createEl('strong', { 
                cls: 'file-title', 
                text: fileSnippet.title || fileSnippet.file.basename 
            });
            titleEl.addEventListener('click', async () => {
                // Open the note in a new pane
                await this.app.workspace.getLeaf(true).openFile(fileSnippet.file);
            });
            
            fileInfo.createEl('span', { text: ` (${fileSnippet.file.path})`, cls: 'file-path' });
            
            // Replace Setting with direct button elements
            const buttonContainer = fileItem.createDiv({ cls: 'button-container' });
            
            // Create Open button
            const openButton = buttonContainer.createEl('button', {
                text: 'Open',
                cls: 'file-action-button'
            });
            openButton.addEventListener('click', async () => {
                await this.app.workspace.getLeaf(false).openFile(fileSnippet.file);
            });
            
            // Create Delete button
            const deleteButton = buttonContainer.createEl('button', {
                text: 'Delete',
                cls: 'file-action-button'
            });
            deleteButton.addEventListener('click', async () => {
                try {
                    await this.app.vault.delete(fileSnippet.file);
                    fileItem.remove();
                    
                    // Update selected count if this item was selected
                    if (fileSnippet.selected) {
                        this.selectedCount--;
                        this.updateBatchDeleteButton();
                    }
                    
                    // Remove from our list
                    this.fileSnippets = this.fileSnippets.filter(fs => fs.file.path !== fileSnippet.file.path);
                    new Notice(`Deleted ${fileSnippet.file.path}`);
                    
                    // Update count
                    description.setText(`Found ${this.fileSnippets.length} blank notes. Select notes and use batch delete, or delete individually.`);
                    
                    if (this.fileSnippets.length === 0) {
                        fileListContainer.empty();
                        fileListContainer.createEl('p', { text: 'All blank notes have been deleted.' });
                        batchActions.hide();
                    }
                } catch (error) {
                    new Notice(`Failed to delete ${fileSnippet.file.path}: ${error}`);
                }
            });
        }
    }
    
    // Update the batch delete button text and state
    private updateBatchDeleteButton() {
        if (!this.batchDeleteButtonEl) return;
        
        this.batchDeleteButtonEl.innerText = `Delete Selected (${this.selectedCount})`;
        this.batchDeleteButtonEl.disabled = this.selectedCount === 0;
    }
    
    // Update all selection icons to match their corresponding fileSnippet.selected state
    private updateSelectionIcons() {
        const selectionIcons = this.contentEl.querySelectorAll('.file-item .selection-icon');
        selectionIcons.forEach((icon, index) => {
            if (index < this.fileSnippets.length) {
                if (this.fileSnippets[index].selected) {
                    icon.addClass('is-selected');
                    icon.setText('●'); // Filled circle
                } else {
                    icon.removeClass('is-selected');
                    icon.setText('○'); // Empty circle
                }
            }
        });
    }
    
    // Update the select all icon state based on whether all items are selected
    private updateSelectAllIcon() {
        const selectAllIcon = this.contentEl.querySelector('#select-all-icon');
        if (selectAllIcon) {
            const allSelected = this.fileSnippets.every(fs => fs.selected);
            if (allSelected) {
                selectAllIcon.addClass('is-selected');
                selectAllIcon.setText('●'); // Filled circle
            } else {
                selectAllIcon.removeClass('is-selected');
                selectAllIcon.setText('○'); // Empty circle
            }
        }
    }
}