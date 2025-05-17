// Projects section improvements
document.addEventListener('DOMContentLoaded', () => {
    const projectsGrid = document.querySelector('.projects-grid');
    if (projectsGrid) {
        // Add navigation buttons
        const projectsSection = document.querySelector('#projects .container');
        const navDiv = document.createElement('div');
        navDiv.className = 'projects-navigation';
        navDiv.innerHTML = `
            <div class="project-nav-btn prev"><i class="fas fa-chevron-left"></i></div>
            <div class="project-nav-btn next"><i class="fas fa-chevron-right"></i></div>
        `;
        projectsSection.appendChild(navDiv);

        // Add navigation functionality
        const prevBtn = navDiv.querySelector('.prev');
        const nextBtn = navDiv.querySelector('.next');

        prevBtn.addEventListener('click', () => {
            projectsGrid.scrollBy({left: -350, behavior: 'smooth'});
        });

        nextBtn.addEventListener('click', () => {
            projectsGrid.scrollBy({left: 350, behavior: 'smooth'});
        });

        // Fix project cards duplication
        const duplicateProjectsContainer = document.querySelector('.projects-grid .projects-grid');
        if (duplicateProjectsContainer) {
            const parentContainer = duplicateProjectsContainer.parentNode;
            const childCards = duplicateProjectsContainer.querySelectorAll('.project-card');
            
            childCards.forEach(card => {
                parentContainer.appendChild(card.cloneNode(true));
            });
            
            parentContainer.removeChild(duplicateProjectsContainer);
        }

        // Add expand buttons to project cards
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            const expandBtn = document.createElement('div');
            expandBtn.className = 'project-expand';
            expandBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
            card.appendChild(expandBtn);

            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openProjectModal(card);
            });
        });
    }
});

// Create modal for project details
function openProjectModal(projectCard) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('projectModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'projectModal';
        modal.className = 'project-modal';
        document.body.appendChild(modal);
    }

    // Get project data
    const title = projectCard.querySelector('h3').textContent;
    const imgSrc = projectCard.querySelector('.project-img img').src;
    const description = projectCard.querySelector('p').textContent;
    const tagsHTML = projectCard.querySelector('.project-tags').innerHTML;

    // Populate modal
    modal.innerHTML = `
        <div class="project-modal-content">
            <span class="close-modal"><i class="fas fa-times"></i></span>
            <h2>${title}</h2>
            <div style="margin: 1.5rem 0;">
                <img src="${imgSrc}" alt="${title}" style="max-width: 100%; border-radius: var(--border-radius);">
            </div>
            <p style="margin-bottom: 1.5rem;">${description}</p>
            <div class="project-tags" style="margin-bottom: 1.5rem;">${tagsHTML}</div>
        </div>
    `;

    // Show modal
    modal.style.display = 'block';

    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
