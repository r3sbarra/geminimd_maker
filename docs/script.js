document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('gemini-form');
    const geminiOutput = document.getElementById('gemini-output');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const importButton = document.getElementById('import-button');
    const importFile = document.getElementById('import-file');
    const copyButton = document.getElementById('copy-button');
    const downloadButton = document.getElementById('download-button');
    const addSectionButton = document.getElementById('add-section-button');
    const dynamicSectionsContainer = document.getElementById('dynamic-sections-container');
    const sectionTemplate = document.getElementById('section-template');

    const manageTemplatesButton = document.getElementById('manage-templates-button');
    const templateModal = document.getElementById('template-modal');
    const closeModal = templateModal.querySelector('.close-button');
    const templateList = document.getElementById('template-list');
    const saveCustomTemplateButton = document.getElementById('save-custom-template-button');
    const templateNameInput = document.getElementById('template-name');

    // Predefined templates
    const predefinedTemplates = {
        basic: {
            projectName: 'My Awesome Project',
            projectOwner: 'Your Name',
            tools: [],
            sections: [
                { title: 'Description', content: 'A brief description of my awesome project.' },
                { title: 'Language', content: 'Python' },
                { title: 'Persona', content: 'You are a helpful assistant.' },
                { title: 'Output Format', content: 'Markdown' },
                { title: 'Instructions', content: 'Follow standard coding practices.' },
                { title: 'Usage', content: 'Run `python main.py` to start.' },
                { title: 'Contributing', content: 'Please read the contributing guidelines before submitting a pull request.' }
            ]
        },
        'web-app': {
            projectName: 'My Web App',
            projectOwner: 'Your Name',
            tools: ['JavaScript', 'Web Fetch'],
            sections: [
                { title: 'Description', content: 'A web application that does amazing things.' },
                { title: 'Language', content: 'JavaScript' },
                { title: 'Persona', content: 'You are a full-stack web developer.' },
                { title: 'Output Format', content: 'HTML' },
                { title: 'Instructions', content: 'Use React components and follow the Material Design guidelines.' },
                { title: 'Usage', content: 'Run `npm start` to launch the development server.' },
                { title: 'Contributing', content: 'Contributions are welcome! Please create an issue to discuss your ideas.' }
            ]
        },
        cli: {
            projectName: 'My CLI Tool',
            projectOwner: 'Your Name',
            tools: ['Go', 'File System Tools'],
            sections: [
                { title: 'Description', content: 'A command-line interface for performing useful tasks.' },
                { title: 'Language', content: 'Go' },
                { title: 'Persona', content: 'You are a command-line tool expert.' },
                { title: 'Output Format', content: 'Markdown' },
                { title: 'Instructions', content: 'Use the Cobra library for commands and flags.' },
                { title: 'Usage', content: 'Run `./my-cli-tool --help` to see available commands.' },
                { title: 'Contributing', content: 'Please report any bugs or feature requests in the issue tracker.' }
            ]
        }
    };

    let customTemplates = JSON.parse(localStorage.getItem('customTemplates')) || {};

    // --- Helper Functions ---
    function updatePreview() {
        const projectName = document.getElementById('project-name').value;
        const projectOwner = document.getElementById('project-owner').value;
        const selectedTools = Array.from(document.querySelectorAll('input[name="tool"]:checked')).map(cb => cb.value);

        let geminiContent = `# ${projectName || '[Project Name]'}\n\n`;
        geminiContent += `**Owner**: ${projectOwner || 'N/A'}\n\n`;

        if (selectedTools.length > 0) {
            geminiContent += `## Available Tools\n\n`;
            selectedTools.forEach(tool => {
                geminiContent += `- ${tool}\n`;
            });
            geminiContent += '\n';
        }

        document.querySelectorAll('.dynamic-section').forEach(sectionDiv => {
            const title = sectionDiv.querySelector('.section-title').value.trim();
            const content = sectionDiv.querySelector('.section-content').value.trim();
            if (title && content) {
                geminiContent += `## ${title}\n\n${content}\n\n`;
            }
        });

        geminiOutput.textContent = geminiContent;
        hljs.highlightElement(geminiOutput);
    }

    function addSection(title = '', content = '') {
        const clone = sectionTemplate.content.cloneNode(true);
        const sectionDiv = clone.querySelector('.dynamic-section');
        const titleInput = sectionDiv.querySelector('.section-title');
        const contentTextarea = sectionDiv.querySelector('.section-content');
        const removeButton = sectionDiv.querySelector('.remove-section-button');
        const markdownToolbar = sectionDiv.querySelector('.markdown-toolbar');

        titleInput.value = title;
        contentTextarea.value = content;

        removeButton.addEventListener('click', () => {
            sectionDiv.remove();
            updatePreview();
        });

        markdownToolbar.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                applyMarkdown(contentTextarea, e.target.dataset.md);
            }
        });

        [titleInput, contentTextarea].forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        dynamicSectionsContainer.appendChild(clone);
        updatePreview();
    }

    function applyMarkdown(textarea, type) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let newText = '';

        switch (type) {
            case 'h2':
                newText = `## ${selectedText || 'Heading'}\n`;
                break;
            case 'bold':
                newText = `**${selectedText || 'bold text'}**`;
                break;
            case 'italic':
                newText = `*${selectedText || 'italic text'}*`;
                break;
            case 'link':
                newText = `[${selectedText || 'Link Text'}](https://example.com)`;
                break;
            case 'list':
                newText = `- ${selectedText || 'List Item'}`; // Simple list item
                break;
        }

        textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        textarea.focus();
        updatePreview();
    }

    function loadTemplate(templateData) {
        document.getElementById('project-name').value = templateData.projectName || '';
        document.getElementById('project-owner').value = templateData.projectOwner || '';

        // Clear existing dynamic sections
        dynamicSectionsContainer.innerHTML = '';

        // Set tools
        document.querySelectorAll('input[name="tool"]').forEach(cb => {
            cb.checked = templateData.tools.includes(cb.value);
        });

        // Add dynamic sections from template
        templateData.sections.forEach(section => {
            addSection(section.title, section.content);
        });
        updatePreview();
    }

    function populateTemplateManagementModal() {
        templateList.innerHTML = '';
        const allTemplates = { ...predefinedTemplates, ...customTemplates };

        for (const name in allTemplates) {
            const templateDiv = document.createElement('div');
            templateDiv.classList.add('template-item');
            templateDiv.innerHTML = `
                <span>${name}</span>
                <button class="apply-template-button" data-template-name="${name}">Apply</button>
                ${predefinedTemplates[name] ? '' : `<button class="delete-template-button" data-template-name="${name}">Delete</button>`}
            `;
            templateList.appendChild(templateDiv);
        }

        templateList.querySelectorAll('.apply-template-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const name = e.target.dataset.templateName;
                loadTemplate(allTemplates[name]);
                templateModal.style.display = 'none';
            });
        });

        templateList.querySelectorAll('.delete-template-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const name = e.target.dataset.templateName;
                if (confirm(`Are you sure you want to delete template \'${name}\'?`)) {
                    delete customTemplates[name];
                    localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
                    populateTemplateManagementModal(); // Refresh the list
                }
            });
        });
    }

    // --- Event Listeners ---
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    importButton.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                // Simple parsing for import - might need more robust logic for complex MD
                const lines = content.split('\n');
                let projectName = '';
                let projectOwner = '';
                const sections = [];
                let currentSectionTitle = '';
                let currentSectionContent = '';

                lines.forEach(line => {
                    if (line.startsWith('# ')) {
                        projectName = line.substring(2).trim();
                    } else if (line.startsWith('**Owner**:')) {
                        projectOwner = line.substring(9).trim();
                    } else if (line.startsWith('## ')) {
                        if (currentSectionTitle && currentSectionContent) {
                            sections.push({ title: currentSectionTitle, content: currentSectionContent.trim() });
                        }
                        currentSectionTitle = line.substring(3).trim();
                        currentSectionContent = '';
                    } else {
                        currentSectionContent += line + '\n';
                    }
                });
                if (currentSectionTitle && currentSectionContent) {
                    sections.push({ title: currentSectionTitle, content: currentSectionContent.trim() });
                }

                document.getElementById('project-name').value = projectName;
                document.getElementById('project-owner').value = projectOwner;
                dynamicSectionsContainer.innerHTML = ''; // Clear existing
                sections.forEach(sec => addSection(sec.title, sec.content));
                updatePreview();
            };
            reader.readAsText(file);
        }
    });

    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(geminiOutput.textContent).then(() => {
            alert('Copied to clipboard!');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    });

    downloadButton.addEventListener('click', () => {
        const blob = new Blob([geminiOutput.textContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'GEMINI.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    addSectionButton.addEventListener('click', () => addSection());

    manageTemplatesButton.addEventListener('click', () => {
        populateTemplateManagementModal();
        templateModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        templateModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === templateModal) {
            templateModal.style.display = 'none';
        }
    });

    saveCustomTemplateButton.addEventListener('click', () => {
        const name = templateNameInput.value.trim();
        if (name) {
            const projectName = document.getElementById('project-name').value;
            const projectOwner = document.getElementById('project-owner').value;
            const tools = Array.from(document.querySelectorAll('input[name="tool"]:checked')).map(cb => cb.value);
            const sections = [];
            document.querySelectorAll('.dynamic-section').forEach(sectionDiv => {
                sections.push({
                    title: sectionDiv.querySelector('.section-title').value,
                    content: sectionDiv.querySelector('.section-content').value
                });
            });

            customTemplates[name] = { projectName, projectOwner, tools, sections };
            localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
            populateTemplateManagementModal(); // Refresh the list in the modal
            templateModal.style.display = 'none';
            templateNameInput.value = '';
            alert(`Template \'${name}\' saved!`);
        } else {
            alert('Please enter a template name.');
        }
    });

    // Initial setup
    addSection('Description', 'A brief description of the project.');
    addSection('Language', 'Python');
    addSection('Persona', 'You are a helpful assistant.');
    addSection('Output Format', 'Markdown');
    addSection('Instructions', 'Follow standard coding practices.');
    addSection('Usage', '[Instructions on how to use the project]');
    addSection('Contributing', '[Guidelines for contributing]');

    updatePreview();
});