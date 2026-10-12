let WEDDING_CONFIG = null;
        let mapInstance = null;
        let sortableInstance = null;

        /* =========================================================
           CONFIGURATION: config.json is required and is the only source
           ========================================================= */
        async function loadConfig() {
            const response = await fetch('config.json', { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Could not load config.json (HTTP ${response.status}).`);
            }

            const config = await response.json();
            const requiredPaths = [
                config?.couple?.groomName,
                config?.couple?.brideName,
                config?.wedding?.dateText,
                config?.wedding?.isoDate,
                config?.wedding?.rsvpDeadline,
                config?.venue?.name,
                config?.venue?.address,
                config?.venue?.coordinates?.lat,
                config?.venue?.coordinates?.lng,
                config?.content?.hero?.welcomeText,
                config?.content?.scripture?.quote,
                config?.content?.program,
                config?.content?.profiles,
                config?.content?.loveStory?.milestones,
                config?.content?.gallery?.images,
                config?.content?.directions,
                config?.content?.dressCode?.palette,
                config?.content?.rsvp?.fields?.attendanceOptions,
                config?.content?.rsvp?.fields?.guestCountOptions,
                config?.theme?.colors,
                config?.features,
                config?.calendar?.startDate,
                config?.calendar?.endDate
            ];

            if (requiredPaths.some(value => value === undefined || value === null)) {
                throw new Error('config.json is missing one or more required configuration fields.');
            }

            WEDDING_CONFIG = config;
        }

        /* =========================================================
           INITIALIZATION
           ========================================================= */
        document.addEventListener('DOMContentLoaded', async function() {
            document.body.style.visibility = 'hidden';
            try {
                await loadConfig();
                populateCustomizerInputs();
                renderProgramTimeline();
                renderProgramEvents();
                renderDressCodePalette();
                renderPaletteEditor();
                renderThemeColors();
                renderRSVPFormOptions();
                renderInitialPage();
                initLeafletMap();
                startCountdown();
                applyFeatureToggles();
                document.body.style.visibility = 'visible';
            } catch (error) {
                document.body.style.visibility = 'visible';
                document.body.innerHTML = `
                    <main style="max-width:640px;margin:12vh auto;padding:2rem;font-family:Arial,sans-serif;background:#fff;border-radius:16px;color:#58111a;box-shadow:0 10px 35px #0002">
                        <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem">Invitation configuration error</h1>
                        <p style="margin-bottom:.75rem">The invitation could not load because <code>config.json</code> is missing, unavailable, or invalid.</p>
                        <p style="color:#555">${error.message}</p>
                    </main>`;
                console.error('Invitation initialization failed:', error);
            }
        });

        /* =========================================================
           RENDER INITIAL PAGE FROM CONFIG
           ========================================================= */
        function renderInitialPage() {
            updateLiveConfig();
        }

        /* =========================================================
           POPULATE CUSTOMIZER INPUTS
           ========================================================= */
        function populateCustomizerInputs() {
            document.getElementById('cfgGroom').value = WEDDING_CONFIG.couple.groomName;
            document.getElementById('cfgBride').value = WEDDING_CONFIG.couple.brideName;
            document.getElementById('cfgDate').value = WEDDING_CONFIG.wedding.dateText;
            document.getElementById('cfgIsoDate').value = WEDDING_CONFIG.wedding.isoDate;
            document.getElementById('cfgRsvDeadline').value = WEDDING_CONFIG.wedding.rsvpDeadline;
            document.getElementById('cfgChurch').value = WEDDING_CONFIG.venue.name;
            document.getElementById('cfgAddress').value = WEDDING_CONFIG.venue.address;
            document.getElementById('cfgLat').value = WEDDING_CONFIG.venue.coordinates.lat;
            document.getElementById('cfgLng').value = WEDDING_CONFIG.venue.coordinates.lng;
            document.getElementById('cfgOfficiant').value = WEDDING_CONFIG.venue.officiant;
            document.getElementById('cfgMapLink').value = WEDDING_CONFIG.venue.mapLink;
            document.getElementById('cfgHeroYear').value = WEDDING_CONFIG.content.hero.yearBackdrop;
            document.getElementById('cfgWelcomeText').value = WEDDING_CONFIG.content.hero.welcomeText;
            document.getElementById('cfgScripture').value = WEDDING_CONFIG.content.scripture.quote;
            document.getElementById('cfgScriptureRef').value = WEDDING_CONFIG.content.scripture.reference;
            document.getElementById('cfgDressCodeTitle').value = WEDDING_CONFIG.content.dressCode.title;
            document.getElementById('cfgDressCodeSubtitle').value = WEDDING_CONFIG.content.dressCode.subtitle;
            document.getElementById('cfgDressCodeDesc').value = WEDDING_CONFIG.content.dressCode.description;
            document.getElementById('cfgCountdownTitle').value = WEDDING_CONFIG.content.countdown.title;
            document.getElementById('cfgCountdownSub').value = WEDDING_CONFIG.content.countdown.subtitle;
            document.getElementById('cfgRsvpTitle').value = WEDDING_CONFIG.content.rsvp.title;
            document.getElementById('cfgRsvpSubtitle').value = WEDDING_CONFIG.content.rsvp.subtitle;
            document.getElementById('cfgRsvpEndpoint').value = WEDDING_CONFIG.content.rsvp.formEndpoint;
            document.getElementById('cfgRsvpNameLabel').value = WEDDING_CONFIG.content.rsvp.fields.nameLabel;
            document.getElementById('cfgRsvpNamePlaceholder').value = WEDDING_CONFIG.content.rsvp.fields.namePlaceholder;
            document.getElementById('cfgRsvpAttendanceLabel').value = WEDDING_CONFIG.content.rsvp.fields.attendanceLabel;
            document.getElementById('cfgRsvpAttendanceOptions').value = WEDDING_CONFIG.content.rsvp.fields.attendanceOptions.join(', ');
            document.getElementById('cfgRsvpGuestCountLabel').value = WEDDING_CONFIG.content.rsvp.fields.guestCountLabel;
            document.getElementById('cfgRsvpGuestCountOptions').value = WEDDING_CONFIG.content.rsvp.fields.guestCountOptions.join(', ');
            document.getElementById('cfgRsvpNotesLabel').value = WEDDING_CONFIG.content.rsvp.fields.notesLabel;
            document.getElementById('cfgRsvpNotesPlaceholder').value = WEDDING_CONFIG.content.rsvp.fields.notesPlaceholder;
            document.getElementById('cfgRsvpSubmitText').value = WEDDING_CONFIG.content.rsvp.fields.submitText;
            document.getElementById('cfgRsvpSuccessTitle').value = WEDDING_CONFIG.content.rsvp.success.title;
            document.getElementById('cfgRsvpSuccessMessage').value = WEDDING_CONFIG.content.rsvp.success.message;
            document.getElementById('cfgFooterText').value = WEDDING_CONFIG.content.footer.text;
            document.getElementById('cfgFooterSubtitle').value = WEDDING_CONFIG.content.footer.subtitle;
            document.getElementById('cfgCalendarTitle').value = WEDDING_CONFIG.calendar.title;
            document.getElementById('cfgCalendarDetails').value = WEDDING_CONFIG.calendar.details;
            document.getElementById('cfgCalendarStart').value = WEDDING_CONFIG.calendar.startDate;
            document.getElementById('cfgCalendarEnd').value = WEDDING_CONFIG.calendar.endDate;
            
            // Couple profile, love story, gallery and directions settings
            document.getElementById('cfgProfilesTitle').value = WEDDING_CONFIG.content.profiles.title;
            document.getElementById('cfgProfilesSubtitle').value = WEDDING_CONFIG.content.profiles.subtitle;
            document.getElementById('cfgGroomPhoto').value = WEDDING_CONFIG.content.profiles.groomPhoto;
            document.getElementById('cfgBridePhoto').value = WEDDING_CONFIG.content.profiles.bridePhoto;
            document.getElementById('cfgGroomBio').value = WEDDING_CONFIG.content.profiles.groomBio;
            document.getElementById('cfgBrideBio').value = WEDDING_CONFIG.content.profiles.brideBio;
            document.getElementById('cfgLoveTitle').value = WEDDING_CONFIG.content.loveStory.title;
            document.getElementById('cfgLoveSubtitle').value = WEDDING_CONFIG.content.loveStory.subtitle;
            document.getElementById('cfgLoveIntro').value = WEDDING_CONFIG.content.loveStory.intro;
            document.getElementById('cfgLoveMilestones').value = WEDDING_CONFIG.content.loveStory.milestones.map(m => `${m.date} | ${m.title} | ${m.description}`).join('\n');
            document.getElementById('cfgGalleryTitle').value = WEDDING_CONFIG.content.gallery.title;
            document.getElementById('cfgGallerySubtitle').value = WEDDING_CONFIG.content.gallery.subtitle;
            document.getElementById('cfgGalleryImages').value = WEDDING_CONFIG.content.gallery.images.join('\n');
            document.getElementById('cfgDirectionsTitle').value = WEDDING_CONFIG.content.directions.title;
            document.getElementById('cfgDirectionsSubtitle').value = WEDDING_CONFIG.content.directions.subtitle;
            document.getElementById('cfgDirectionsNote').value = WEDDING_CONFIG.content.directions.note;
            // Feature toggles
            document.getElementById('tglCouple').checked = WEDDING_CONFIG.features.showCoupleCards;
            document.getElementById('tglLoveStory').checked = WEDDING_CONFIG.features.showLoveStory;
            document.getElementById('tglGallery').checked = WEDDING_CONFIG.features.showGallery;
            document.getElementById('tglDirections').checked = WEDDING_CONFIG.features.showDirections;
            document.getElementById('tglProgram').checked = WEDDING_CONFIG.features.showProgram;
            document.getElementById('tglScripture').checked = WEDDING_CONFIG.features.showScripture;
            document.getElementById('tglCountdown').checked = WEDDING_CONFIG.features.showCountdown;
            document.getElementById('tglRSVP').checked = WEDDING_CONFIG.features.showRSVP;
            document.getElementById('tglMusic').checked = WEDDING_CONFIG.features.enableMusic;
            document.getElementById('tglCalendar').checked = WEDDING_CONFIG.features.enableCalendar;
        }

        /* =========================================================
           LIVE CONFIG UPDATE - Read all inputs, apply to DOM + config
           ========================================================= */
        function updateLiveConfig() {
            // Read from inputs
            WEDDING_CONFIG.couple.groomName = document.getElementById('cfgGroom').value;
            WEDDING_CONFIG.couple.brideName = document.getElementById('cfgBride').value;
            WEDDING_CONFIG.wedding.dateText = document.getElementById('cfgDate').value;
            WEDDING_CONFIG.wedding.isoDate = document.getElementById('cfgIsoDate').value;
            WEDDING_CONFIG.wedding.rsvpDeadline = document.getElementById('cfgRsvDeadline').value;
            WEDDING_CONFIG.venue.name = document.getElementById('cfgChurch').value;
            WEDDING_CONFIG.venue.address = document.getElementById('cfgAddress').value;
            WEDDING_CONFIG.venue.officiant = document.getElementById('cfgOfficiant').value;
            WEDDING_CONFIG.venue.mapLink = document.getElementById('cfgMapLink').value;
            WEDDING_CONFIG.content.hero.yearBackdrop = document.getElementById('cfgHeroYear').value;
            WEDDING_CONFIG.content.hero.welcomeText = document.getElementById('cfgWelcomeText').value;
            WEDDING_CONFIG.content.scripture.quote = document.getElementById('cfgScripture').value;
            WEDDING_CONFIG.content.scripture.reference = document.getElementById('cfgScriptureRef').value;
            WEDDING_CONFIG.content.dressCode.title = document.getElementById('cfgDressCodeTitle').value;
            WEDDING_CONFIG.content.dressCode.subtitle = document.getElementById('cfgDressCodeSubtitle').value;
            WEDDING_CONFIG.content.dressCode.description = document.getElementById('cfgDressCodeDesc').value;
            WEDDING_CONFIG.content.countdown.title = document.getElementById('cfgCountdownTitle').value;
            WEDDING_CONFIG.content.countdown.subtitle = document.getElementById('cfgCountdownSub').value;
            WEDDING_CONFIG.content.rsvp.title = document.getElementById('cfgRsvpTitle').value;
            WEDDING_CONFIG.content.rsvp.subtitle = document.getElementById('cfgRsvpSubtitle').value;
            WEDDING_CONFIG.content.rsvp.formEndpoint = document.getElementById('cfgRsvpEndpoint').value;
            WEDDING_CONFIG.content.rsvp.fields.nameLabel = document.getElementById('cfgRsvpNameLabel').value;
            WEDDING_CONFIG.content.rsvp.fields.namePlaceholder = document.getElementById('cfgRsvpNamePlaceholder').value;
            WEDDING_CONFIG.content.rsvp.fields.attendanceLabel = document.getElementById('cfgRsvpAttendanceLabel').value;
            WEDDING_CONFIG.content.rsvp.fields.attendanceOptions = document.getElementById('cfgRsvpAttendanceOptions').value.split(',').map(s => s.trim()).filter(Boolean);
            WEDDING_CONFIG.content.rsvp.fields.guestCountLabel = document.getElementById('cfgRsvpGuestCountLabel').value;
            WEDDING_CONFIG.content.rsvp.fields.guestCountOptions = document.getElementById('cfgRsvpGuestCountOptions').value.split(',').map(s => s.trim()).filter(Boolean);
            WEDDING_CONFIG.content.rsvp.fields.notesLabel = document.getElementById('cfgRsvpNotesLabel').value;
            WEDDING_CONFIG.content.rsvp.fields.notesPlaceholder = document.getElementById('cfgRsvpNotesPlaceholder').value;
            WEDDING_CONFIG.content.rsvp.fields.submitText = document.getElementById('cfgRsvpSubmitText').value;
            WEDDING_CONFIG.content.rsvp.success.title = document.getElementById('cfgRsvpSuccessTitle').value;
            WEDDING_CONFIG.content.rsvp.success.message = document.getElementById('cfgRsvpSuccessMessage').value;
            WEDDING_CONFIG.content.footer.text = document.getElementById('cfgFooterText').value;
            WEDDING_CONFIG.content.footer.subtitle = document.getElementById('cfgFooterSubtitle').value;
            WEDDING_CONFIG.calendar.title = document.getElementById('cfgCalendarTitle').value;
            WEDDING_CONFIG.calendar.details = document.getElementById('cfgCalendarDetails').value;
            WEDDING_CONFIG.calendar.startDate = document.getElementById('cfgCalendarStart').value;
            WEDDING_CONFIG.calendar.endDate = document.getElementById('cfgCalendarEnd').value;

            // Read couple cards, love story, gallery and directions settings
            WEDDING_CONFIG.content.profiles.title = document.getElementById('cfgProfilesTitle').value;
            WEDDING_CONFIG.content.profiles.subtitle = document.getElementById('cfgProfilesSubtitle').value;
            WEDDING_CONFIG.content.profiles.groomPhoto = document.getElementById('cfgGroomPhoto').value.trim();
            WEDDING_CONFIG.content.profiles.bridePhoto = document.getElementById('cfgBridePhoto').value.trim();
            WEDDING_CONFIG.content.profiles.groomBio = document.getElementById('cfgGroomBio').value;
            WEDDING_CONFIG.content.profiles.brideBio = document.getElementById('cfgBrideBio').value;
            WEDDING_CONFIG.content.loveStory.title = document.getElementById('cfgLoveTitle').value;
            WEDDING_CONFIG.content.loveStory.subtitle = document.getElementById('cfgLoveSubtitle').value;
            WEDDING_CONFIG.content.loveStory.intro = document.getElementById('cfgLoveIntro').value;
            WEDDING_CONFIG.content.loveStory.milestones = document.getElementById('cfgLoveMilestones').value.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
                const [date, title, ...description] = line.split('|').map(part => part.trim());
                return date && title && description.join(' | ') ? { date, title, description: description.join(' | ') } : null;
            }).filter(Boolean);
            WEDDING_CONFIG.content.gallery.title = document.getElementById('cfgGalleryTitle').value;
            WEDDING_CONFIG.content.gallery.subtitle = document.getElementById('cfgGallerySubtitle').value;
            WEDDING_CONFIG.content.gallery.images = document.getElementById('cfgGalleryImages').value.split('\n').map(url => url.trim()).filter(Boolean);
            WEDDING_CONFIG.content.directions.title = document.getElementById('cfgDirectionsTitle').value;
            WEDDING_CONFIG.content.directions.subtitle = document.getElementById('cfgDirectionsSubtitle').value;
            WEDDING_CONFIG.content.directions.note = document.getElementById('cfgDirectionsNote').value;
            // Coordinates
            WEDDING_CONFIG.venue.coordinates.lat = Number(document.getElementById('cfgLat').value);
            WEDDING_CONFIG.venue.coordinates.lng = Number(document.getElementById('cfgLng').value);

            // Apply to DOM
            document.getElementById('heroGroom').innerText = WEDDING_CONFIG.couple.groomName;
            document.getElementById('heroBride').innerText = WEDDING_CONFIG.couple.brideName;
            document.getElementById('heroYearBackdrop').innerText = WEDDING_CONFIG.content.hero.yearBackdrop;
            document.getElementById('heroWelcomeText').innerText = WEDDING_CONFIG.content.hero.welcomeText;
            
            const groomInitial = WEDDING_CONFIG.couple.groomName ? WEDDING_CONFIG.couple.groomName[0].toUpperCase() : '';
            const brideInitial = WEDDING_CONFIG.couple.brideName ? WEDDING_CONFIG.couple.brideName[0].toUpperCase() : '';
            document.getElementById('navInitials').innerText = `${groomInitial} & ${brideInitial}`;
            document.getElementById('navDateBadge').innerText = WEDDING_CONFIG.wedding.dateText;
            
            document.getElementById('churchName').innerText = WEDDING_CONFIG.venue.name;
            document.getElementById('churchAddress').innerText = WEDDING_CONFIG.venue.address;
            document.getElementById('priestNote').innerText = WEDDING_CONFIG.venue.officiant;
            document.getElementById('mapLinkBtn').href = WEDDING_CONFIG.venue.mapLink;
            
            document.getElementById('scriptureText').innerText = WEDDING_CONFIG.content.scripture.quote;
            document.getElementById('scriptureRef').innerText = WEDDING_CONFIG.content.scripture.reference;
            
            document.getElementById('countdownTitle').innerText = WEDDING_CONFIG.content.countdown.title;
            document.getElementById('countdownSub').innerText = `${WEDDING_CONFIG.wedding.dateText} • ${WEDDING_CONFIG.venue.name}`;
            
            document.getElementById('rsvpTitle').innerText = WEDDING_CONFIG.content.rsvp.title;
            document.getElementById('rsvpDeadlineText').innerText = `${WEDDING_CONFIG.content.rsvp.subtitle}`;
            document.getElementById('rsvpSuccessTitle').innerText = WEDDING_CONFIG.content.rsvp.success.title;
            document.getElementById('rsvpSuccessMessage').innerText = WEDDING_CONFIG.content.rsvp.success.message;
            
            document.getElementById('footerCoupleText').innerText = `${WEDDING_CONFIG.couple.groomName} & ${WEDDING_CONFIG.couple.brideName}'s Wedding`;
            document.getElementById('footerSubtitle').innerText = `${WEDDING_CONFIG.content.footer.subtitle}`;

            // Render customizable couple cards
            document.getElementById('profilesTitle').innerText = WEDDING_CONFIG.content.profiles.title;
            document.getElementById('profilesSubtitle').innerText = WEDDING_CONFIG.content.profiles.subtitle;
            document.getElementById('groomCardName').innerText = WEDDING_CONFIG.couple.groomName;
            document.getElementById('brideCardName').innerText = WEDDING_CONFIG.couple.brideName;
            document.getElementById('groomBio').innerText = WEDDING_CONFIG.content.profiles.groomBio;
            document.getElementById('brideBio').innerText = WEDDING_CONFIG.content.profiles.brideBio;
            setProfilePhoto('groomPhoto', 'groomPhotoPlaceholder', WEDDING_CONFIG.content.profiles.groomPhoto);
            setProfilePhoto('bridePhoto', 'bridePhotoPlaceholder', WEDDING_CONFIG.content.profiles.bridePhoto);

            // Render love story, gallery and directions
            document.getElementById('loveStoryTitle').innerText = WEDDING_CONFIG.content.loveStory.title;
            document.getElementById('loveStorySubtitle').innerText = WEDDING_CONFIG.content.loveStory.subtitle;
            document.getElementById('loveStoryIntro').innerText = WEDDING_CONFIG.content.loveStory.intro;
            renderLoveStory();
            document.getElementById('galleryTitle').innerText = WEDDING_CONFIG.content.gallery.title;
            document.getElementById('gallerySubtitle').innerText = WEDDING_CONFIG.content.gallery.subtitle;
            renderPhotoGallery();
            document.getElementById('directionsTitle').innerText = WEDDING_CONFIG.content.directions.title;
            document.getElementById('directionsSubtitle').innerText = WEDDING_CONFIG.content.directions.subtitle;
            document.getElementById('directionsVenue').innerText = WEDDING_CONFIG.venue.name;
            document.getElementById('directionsAddress').innerText = WEDDING_CONFIG.venue.address;
            document.getElementById('directionsNote').innerText = WEDDING_CONFIG.content.directions.note;
            document.getElementById('directionsMapLink').href = WEDDING_CONFIG.venue.mapLink;


            // Update RSVP form placeholders/labels
            document.querySelector('label[for="guestName"]').innerText = WEDDING_CONFIG.content.rsvp.fields.nameLabel;
            document.getElementById('guestName').placeholder = WEDDING_CONFIG.content.rsvp.fields.namePlaceholder;
            document.getElementById('rsvpAttendanceLabel').innerText = WEDDING_CONFIG.content.rsvp.fields.attendanceLabel;
            document.getElementById('rsvpGuestCountLabel').innerText = WEDDING_CONFIG.content.rsvp.fields.guestCountLabel;
            document.getElementById('rsvpNotesLabel').innerText = WEDDING_CONFIG.content.rsvp.fields.notesLabel;
            document.getElementById('guestMessage').placeholder = WEDDING_CONFIG.content.rsvp.fields.notesPlaceholder;
            document.getElementById('rsvpSubmitBtn').querySelector('span').innerText = WEDDING_CONFIG.content.rsvp.fields.submitText;

            // Re-render RSVP select options
            renderRSVPFormOptions();

            // Re-render program timeline and dress code palette
            renderProgramTimeline();
            renderDressCodePalette();
            
            // Re-render theme colors (CSS vars)
            applyThemeColors();
            
            // Update map with new coordinates
            refreshMap();
        }

        function setProfilePhoto(imageId, placeholderId, source) {
            const image = document.getElementById(imageId);
            const placeholder = document.getElementById(placeholderId);
            if (source.trim()) {
                image.src = source.trim();
                image.classList.remove('hidden');
                placeholder.classList.add('hidden');
            } else {
                image.removeAttribute('src');
                image.classList.add('hidden');
                placeholder.classList.remove('hidden');
            }
        }

        function renderLoveStory() {
            const wrapper = document.getElementById('loveStoryTimeline');
            wrapper.replaceChildren();
            WEDDING_CONFIG.content.loveStory.milestones.forEach((milestone) => {
                const item = document.createElement('article');
                item.className = 'love-story-item';
                const date = document.createElement('p'); date.className = 'love-story-date'; date.textContent = milestone.date;
                const title = document.createElement('h4'); title.className = 'font-serif text-xl text-wine-900 font-semibold'; title.textContent = milestone.title;
                const description = document.createElement('p'); description.className = 'text-xs leading-relaxed text-gray-600 mt-1'; description.textContent = milestone.description;
                item.append(date, title, description); wrapper.appendChild(item);
            });
        }

        function renderPhotoGallery() {
            const gallery = document.getElementById('photoGallery');
            const emptyMessage = document.getElementById('galleryEmptyMessage');
            gallery.replaceChildren();
            const images = WEDDING_CONFIG.content.gallery.images;
            emptyMessage.classList.toggle('hidden', images.length > 0);
            images.forEach((source, index) => {
                const button = document.createElement('button');
                button.type = 'button'; button.className = 'gallery-photo-button';
                button.setAttribute('aria-label', `View wedding photo ${index + 1}`);
                const image = document.createElement('img'); image.src = source; image.alt = `Wedding memory ${index + 1}`; image.loading = 'lazy';
                button.appendChild(image);
                button.addEventListener('click', () => openGalleryImage(source, image.alt));
                gallery.appendChild(button);
            });
        }

        function openGalleryImage(source, alt) {
            const overlay = document.createElement('div'); overlay.className = 'gallery-lightbox'; overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', alt);
            const close = document.createElement('button'); close.className = 'gallery-lightbox-close'; close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', 'Close image');
            const image = document.createElement('img'); image.src = source; image.alt = alt;
            close.addEventListener('click', () => overlay.remove()); overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });
            overlay.append(close, image); document.body.appendChild(overlay); close.focus();
        }

        /* =========================================================
           RSVP FORM OPTIONS RENDERING
           ========================================================= */
        function renderRSVPFormOptions() {
            const attendanceSelect = document.getElementById('attendanceStatus');
            const guestCountSelect = document.getElementById('guestCount');
            attendanceSelect.innerHTML = '';
            WEDDING_CONFIG.content.rsvp.fields.attendanceOptions.forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                attendanceSelect.appendChild(opt);
            });
            guestCountSelect.innerHTML = '';
            WEDDING_CONFIG.content.rsvp.fields.guestCountOptions.forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                guestCountSelect.appendChild(opt);
            });
        }

        /* =========================================================
           PROGRAM EVENTS RENDERING (Timeline)
           ========================================================= */
        function renderProgramTimeline() {
            const wrapper = document.getElementById('programTimelineWrapper');
            wrapper.innerHTML = '';
            const events = WEDDING_CONFIG.content.program;
            if (!Array.isArray(events) || events.length === 0) throw new Error('config.json must contain at least one program event.');
            const isLast = (i) => i === events.length - 1;
            events.forEach((event, i) => {
                const colorMap = {
                    'wine': 'bg-wine-800 border-lavender-200',
                    'cream': 'bg-cream-100 border-wine-800',
                    'lavender': 'bg-lavender-100 border-wine-800'
                };
                const eventColorClass = colorMap[event.color];
                if (!eventColorClass) throw new Error(`Unsupported program event color: ${event.color}`);
                
                const item = document.createElement('div');
                item.className = 'flex items-start mb-8 relative group';
                item.innerHTML = `
                    <div class="w-12 sm:w-16 text-right font-serif font-bold text-wine-900 text-sm sm:text-base pt-0.5 pr-3">${event.time}</div>
                    <div class="w-4 h-4 rounded-full ${eventColorClass.split(' ')[0]} border-2 ${eventColorClass.split(' ')[1]} z-10 my-1 -ml-2 group-hover:scale-125 transition-transform"></div>
                    <div class="text-left pl-4 flex-1">
                        <h4 class="font-serif font-semibold text-wine-900 text-base">${event.title}</h4>
                        <p class="text-xs text-gray-600">${event.description}</p>
                    </div>
                `;
                wrapper.appendChild(item);
            });
        }

        /* =========================================================
           PROGRAM EVENTS EDITOR (Customizer)
           ========================================================= */
        function renderProgramEvents() {
            const editor = document.getElementById('programEventsEditor');
            editor.innerHTML = '';
            const events = WEDDING_CONFIG.content.program;
            
            events.forEach((event, i) => {
                const item = document.createElement('div');
                item.className = 'program-event-item';
                item.dataset.index = i;
                item.innerHTML = `
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-grip-vertical text-gray-400 cursor-move"></i>
                        <span class="text-xs font-semibold text-wine-800">#${i + 1}</span>
                    </div>
                    <div class="config-grid">
                        <input type="text" placeholder="Time (e.g. 15:30)" value="${event.time}" oninput="updateProgramEvent(${i}, 'time', this.value)" class="px-3 py-1.5 border rounded-lg border-lavender-300 text-sm">
                        <input type="text" placeholder="Title" value="${event.title}" oninput="updateProgramEvent(${i}, 'title', this.value)" class="px-3 py-1.5 border rounded-lg border-lavender-300 text-sm">
                        <textarea placeholder="Description" rows="2" oninput="updateProgramEvent(${i}, 'description', this.value)" class="px-3 py-1.5 border rounded-lg border-lavender-300 text-sm resize-none">${event.description}</textarea>
                        <input type="text" placeholder="Icon (fa- class)" value="${event.icon}" oninput="updateProgramEvent(${i}, 'icon', this.value)" class="px-3 py-1.5 border rounded-lg border-lavender-300 text-sm">
                        <select onchange="updateProgramEvent(${i}, 'color', this.value)" class="px-3 py-1.5 border rounded-lg border-lavender-300 text-sm">
                            <option value="cream" ${event.color === 'cream' ? 'selected' : ''}>Cream</option>
                            <option value="wine" ${event.color === 'wine' ? 'selected' : ''}>Wine</option>
                            <option value="lavender" ${event.color === 'lavender' ? 'selected' : ''}>Lavender</option>
                        </select>
                        <button onclick="removeProgramEvent(${i})" class="text-red-500 hover:text-red-700 text-xs font-medium py-1">Remove Event</button>
                    </div>
                `;
                editor.appendChild(item);
            });

            // Initialize SortableJS
            if (sortableInstance) {
                sortableInstance.destroy();
            }
            sortableInstance = new Sortable(editor, {
                handle: '.fa-grip-vertical',
                animation: 150,
                ghostClass: 'program-event-item.dragging',
                onEnd: function() {
                    // Reorder config array
                    const newOrder = [];
                    editor.querySelectorAll('.program-event-item').forEach(item => {
                        const idx = parseInt(item.dataset.index);
                        newOrder.push(WEDDING_CONFIG.content.program[idx]);
                    });
                    WEDDING_CONFIG.content.program = newOrder;
                    renderProgramEvents();
                    renderProgramTimeline();
                        }
            });
        }

        function updateProgramEvent(index, field, value) {
            WEDDING_CONFIG.content.program[index][field] = value;
            renderProgramTimeline();
        }

        function addProgramEvent() {
            WEDDING_CONFIG.content.program.push({
                time: "",
                title: "New Event",
                description: "",
                icon: "fa-church",
                color: "cream"
            });
            renderProgramEvents();
            renderProgramTimeline();
        }

        function removeProgramEvent(index) {
            WEDDING_CONFIG.content.program.splice(index, 1);
            renderProgramEvents();
            renderProgramTimeline();
        }

        /* =========================================================
           DRESS CODE PALETTE RENDERING (Page)
           ========================================================= */
        function renderDressCodePalette() {
            const wrapper = document.getElementById('dressCodePalette');
            wrapper.innerHTML = '';
            WEDDING_CONFIG.content.dressCode.palette.forEach(item => {
                const el = document.createElement('div');
                el.className = 'group relative';
                el.innerHTML = `
                    <div class="w-9 h-9 rounded-full shadow-md border-2 border-white ring-1 ring-lavender-300" style="background-color: ${item.color};"></div>
                    <span class="absolute -top-8 left-1/2 -translate-x-1/2 bg-wine-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">${item.name}</span>
                `;
                wrapper.appendChild(el);
            });
        }

        /* =========================================================
           PALETTE EDITOR (Customizer)
           ========================================================= */
        function renderPaletteEditor() {
            const editor = document.getElementById('paletteEditor');
            editor.innerHTML = '';
            WEDDING_CONFIG.content.dressCode.palette.forEach((item, i) => {
                const el = document.createElement('div');
                el.className = 'palette-item';
                el.innerHTML = `
                    <input type="color" value="${item.color}" onchange="updatePaletteColor(${i}, 'color', this.value)" class="w-6 h-6 rounded cursor-pointer">
                    <input type="text" placeholder="Name" value="${item.name}" oninput="updatePaletteColor(${i}, 'name', this.value)" class="text-xs px-1 py-0.5 border rounded border-lavender-300 w-24">
                    <button onclick="removePaletteItem(${i})" class="text-red-400 hover:text-red-600 text-xs">×</button>
                `;
                editor.appendChild(el);
            });
            const addBtn = document.createElement('button');
            addBtn.onclick = () => addPaletteItem();
            addBtn.className = 'text-xs text-lavender-700 hover:text-wine-900 font-medium py-1';
            addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Palette Item';
            editor.appendChild(addBtn);
        }

        function updatePaletteColor(index, field, value) {
            WEDDING_CONFIG.content.dressCode.palette[index][field] = value;
            renderDressCodePalette();
            renderPaletteEditor();
        }

        function addPaletteItem() {
            WEDDING_CONFIG.content.dressCode.palette.push({ name: "New Color", color: "#c59b27" });
            renderPaletteEditor();
            renderDressCodePalette();
        }

        function removePaletteItem(index) {
            WEDDING_CONFIG.content.dressCode.palette.splice(index, 1);
            renderPaletteEditor();
            renderDressCodePalette();
        }

        /* =========================================================
           THEME COLOR EDITOR (Customizer)
           ========================================================= */
        function renderThemeColors() {
            const editor = document.getElementById('themeColorEditor');
            editor.innerHTML = '';
            const colorGroups = WEDDING_CONFIG.theme.colors;
            for (const groupName in colorGroups) {
                const group = colorGroups[groupName];
                const groupDiv = document.createElement('div');
                groupDiv.className = 'mb-4';
                groupDiv.innerHTML = `<h5 class="font-semibold text-wine-900 mb-2 capitalize">${groupName}</h5>`;
                const grid = document.createElement('div');
                grid.className = 'grid grid-cols-2 gap-2';
                for (const shade in group) {
                    const colorDiv = document.createElement('div');
                    colorDiv.className = 'flex items-center gap-2';
                    colorDiv.innerHTML = `
                        <span class="text-[10px] text-gray-600 w-8">${shade}</span>
                        <input type="color" value="${group[shade]}" onchange="updateThemeColor('${groupName}', '${shade}', this.value)" class="w-10 h-6 rounded cursor-pointer">
                        <input type="text" value="${group[shade]}" onchange="updateThemeColorText('${groupName}', '${shade}', this.value)" class="text-xs px-1 py-0.5 border rounded border-lavender-300 w-20">
                    `;
                    grid.appendChild(colorDiv);
                }
                groupDiv.appendChild(grid);
                editor.appendChild(groupDiv);
            }
        }

        function updateThemeColor(group, shade, color) {
            WEDDING_CONFIG.theme.colors[group][shade] = color;
            document.querySelector(`input[type="color"][onchange*="'${group}'"][onchange*="'${shade}'"]`).nextElementSibling.value = color;
            applyThemeColors();
        }

        function updateThemeColorText(group, shade, value) {
            if (/^#[0-9A-F]{6}$/i.test(value) || /^#[0-9A-F]{3}$/i.test(value)) {
                WEDDING_CONFIG.theme.colors[group][shade] = value;
                applyThemeColors();
                }
        }

        /* =========================================================
           APPLY THEME COLORS TO CSS
           ========================================================= */
        function applyThemeColors() {
            const root = document.documentElement;
            const colors = WEDDING_CONFIG.theme.colors;
            
            // Set CSS custom properties for main accent colors
            root.style.setProperty('--wine-900', colors.wine[900]);
            root.style.setProperty('--wine-800', colors.wine[800]);
            root.style.setProperty('--wine-700', colors.wine[700]);
            root.style.setProperty('--wine-600', colors.wine[600]);
            root.style.setProperty('--wine-500', colors.wine[500]);
            root.style.setProperty('--lavender-500', colors.lavender[500]);
            root.style.setProperty('--lavender-400', colors.lavender[400]);
            root.style.setProperty('--lavender-300', colors.lavender[300]);
            root.style.setProperty('--cream-50', colors.cream[50]);
            root.style.setProperty('--gold-400', colors.gold[400]);
            
            // Update background
            document.body.style.backgroundColor = colors.wine[900];
            document.body.style.backgroundImage = `radial-gradient(circle at 50% 0%, ${colors.wine[800]} 0%, ${colors.wine[900]} 75%)`;
            
            // Update background motifs
            const motif1 = document.getElementById('bgMotif1');
            const motif2 = document.getElementById('bgMotif2');
            if (motif1) motif1.innerHTML = motif1.innerHTML.replace(/fill="[^"]*"/, `fill="${colors.lavender[500]}"`);
            if (motif2) motif2.innerHTML = motif2.innerHTML.replace(/fill="[^"]*"/, `fill="${colors.lavender[300]}"`);
            
            // Re-render map with updated pin color
            refreshMap();
        }

        /* =========================================================
           GEOENCODING (Nominatim - OpenStreetMap)
           ========================================================= */
        async function geocodeAddress() {
            const address = document.getElementById('cfgAddress').value;
            if (!address) {
                showGeocodeStatus('Please enter an address first', 'error');
                return;
            }
            showGeocodeStatus('Searching...', 'loading');
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
                    headers: { 'User-Agent': 'Wedding-Invitation' }
                });
                const data = await response.json();
                if (data && data.length > 0) {
                    const result = data[0];
                    document.getElementById('cfgLat').value = result.lat;
                    document.getElementById('cfgLng').value = result.lon;
                    WEDDING_CONFIG.venue.coordinates = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
                    showGeocodeStatus('Found!', 'success');
                    updateLiveConfig();
                    setTimeout(() => showGeocodeStatus('', ''), 3000);
                } else {
                    showGeocodeStatus('No results found', 'error');
                }
            } catch(e) {
                showGeocodeStatus('Error: ' + e.message, 'error');
            }
        }

        function showGeocodeStatus(message, type) {
            const status = document.getElementById('geocodeStatus');
            status.innerText = message;
            status.className = 'text-[10px] self-center';
            if (type === 'error') status.classList.add('text-red-500');
            else if (type === 'success') status.classList.add('text-green-500');
            else if (type === 'loading') status.classList.add('text-gray-500');
        }

        /* =========================================================
           LEAFLET MAP
           ========================================================= */
        function initLeafletMap() {
            if (!window.L) throw new Error('Leaflet map library failed to load.');
            if (mapInstance) mapInstance.remove();
            const lat = WEDDING_CONFIG.venue.coordinates.lat;
            const lng = WEDDING_CONFIG.venue.coordinates.lng;

            mapInstance = L.map('map', {
                zoomControl: true,
                scrollWheelZoom: false
            }).setView([lat, lng], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(mapInstance);

            const wineColor = WEDDING_CONFIG.theme.colors.wine[900];
            const lavenderColor = WEDDING_CONFIG.theme.colors.lavender[300];

            const churchPinIcon = L.divIcon({
                className: 'custom-church-pin',
                html: `<div style="background-color: ${wineColor}; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.4);"><i class="fa-solid fa-church" style="transform: rotate(45deg); color: ${lavenderColor}; font-size: 14px;"></i></div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 34]
            });

            const popupContent = `<b>${WEDDING_CONFIG.venue.name}</b><br>${WEDDING_CONFIG.venue.address}`;

            L.marker([lat, lng], { icon: churchPinIcon })
                .addTo(mapInstance)
                .bindPopup(popupContent)
                .openPopup();
        }

        function refreshMap() {
            initLeafletMap();
        }

        /* =========================================================
           COUNTDOWN TIMER
           ========================================================= */
        function startCountdown() {
            updateCountdown();
            setInterval(updateCountdown, 1000);
        }

        function updateCountdown() {
            const weddingTime = new Date(WEDDING_CONFIG.wedding.isoDate).getTime();
            const now = new Date().getTime();
            const distance = weddingTime - now;

            if (distance < 0) {
                document.getElementById('countdown-section').innerHTML = "<p class='text-wine-900 font-serif font-bold text-lg'>The Holy Matrimony Has Begun!</p>";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById('cd-days').innerText = String(days).padStart(2, '0');
            document.getElementById('cd-hours').innerText = String(hours).padStart(2, '0');
            document.getElementById('cd-mins').innerText = String(minutes).padStart(2, '0');
            document.getElementById('cd-secs').innerText = String(seconds).padStart(2, '0');
        }

        /* =========================================================
           CALENDAR INTEGRATION
           ========================================================= */
        function addToCalendar() {
            const title = encodeURIComponent(WEDDING_CONFIG.calendar.title);
            let details = WEDDING_CONFIG.calendar.details;
            details = details.replace('{venue}', `${WEDDING_CONFIG.venue.name}, ${WEDDING_CONFIG.venue.address}`);
            details = encodeURIComponent(details);
            const location = encodeURIComponent(`${WEDDING_CONFIG.venue.name}, ${WEDDING_CONFIG.venue.address}`);
            const startDate = WEDDING_CONFIG.calendar.startDate;
            const endDate = WEDDING_CONFIG.calendar.endDate;

            const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
            window.open(calUrl, '_blank');
        }

        /* =========================================================
           RSVP FORM SUBMISSION
           ========================================================= */
        async function handleRSVP(e) {
            e.preventDefault();

            const endpoint = WEDDING_CONFIG.content.rsvp.formEndpoint.trim();
            if (!endpoint) {
                alert('RSVP is not configured yet. Please contact the couple directly.');
                return;
            }

            const submitButton = document.getElementById('rsvpSubmitBtn');
            submitButton.disabled = true;

            const payload = {
                guestName: document.getElementById('guestName').value.trim(),
                status: document.getElementById('attendanceStatus').value,
                count: document.getElementById('guestCount').value,
                message: document.getElementById('guestMessage').value.trim(),
                timestamp: new Date().toISOString()
            };

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) throw new Error(`RSVP server returned HTTP ${response.status}.`);

                document.getElementById('rsvpForm').classList.add('hidden');
                document.getElementById('rsvpSuccess').classList.remove('hidden');
            } catch (error) {
                console.error('RSVP submission failed:', error);
                alert('Your RSVP could not be submitted. Please try again later or contact the couple directly.');
            } finally {
                submitButton.disabled = false;
            }
        }

        /* =========================================================
           SECTION TOGGLE
           ========================================================= */
        function toggleSection(sectionId, isVisible) {
            const el = document.getElementById(sectionId);
            if (el) {
                if (isVisible) el.classList.remove('hidden');
                else el.classList.add('hidden');
            }
            const featureMap = {
                'couple-section': 'showCoupleCards', 'love-story-section': 'showLoveStory',
                'gallery-section': 'showGallery', 'directions-section': 'showDirections',
                'program-section': 'showProgram', 'scripture-section': 'showScripture',
                'dresscode-section': 'showDressCode', 'countdown-section': 'showCountdown',
                'rsvp-section': 'showRSVP'
            };
            const key = featureMap[sectionId];
            if (key && WEDDING_CONFIG && WEDDING_CONFIG.features) WEDDING_CONFIG.features[key] = isVisible;
        }

        function toggleMusicFeature(enabled) {
            WEDDING_CONFIG.features.enableMusic = enabled;
            const btn = document.getElementById('musicToggle');
            if (!enabled) {
                stopChurchChimes();
                btn.style.display = 'none';
            } else {
                btn.style.display = '';
            }
        }

        function toggleCalendarFeature(enabled) {
            WEDDING_CONFIG.features.enableCalendar = enabled;
            const btn = document.getElementById('calendarBtn');
            if (!enabled) {
                btn.style.display = 'none';
            } else {
                btn.style.display = '';
            }
        }

        function applyFeatureToggles() {
            toggleSection('couple-section', WEDDING_CONFIG.features.showCoupleCards);
            toggleSection('love-story-section', WEDDING_CONFIG.features.showLoveStory);
            toggleSection('gallery-section', WEDDING_CONFIG.features.showGallery);
            toggleSection('directions-section', WEDDING_CONFIG.features.showDirections);
            toggleSection('program-section', WEDDING_CONFIG.features.showProgram);
            toggleSection('scripture-section', WEDDING_CONFIG.features.showScripture);
            toggleSection('dresscode-section', WEDDING_CONFIG.features.showDressCode);
            toggleSection('countdown-section', WEDDING_CONFIG.features.showCountdown);
            toggleSection('rsvp-section', WEDDING_CONFIG.features.showRSVP);
            if (!WEDDING_CONFIG.features.enableMusic) {
                document.getElementById('musicToggle').style.display = 'none';
            }
            if (!WEDDING_CONFIG.features.enableCalendar) {
                document.getElementById('calendarBtn').style.display = 'none';
            }
            document.getElementById('tglCouple').checked = WEDDING_CONFIG.features.showCoupleCards;
            document.getElementById('tglLoveStory').checked = WEDDING_CONFIG.features.showLoveStory;
            document.getElementById('tglGallery').checked = WEDDING_CONFIG.features.showGallery;
            document.getElementById('tglDirections').checked = WEDDING_CONFIG.features.showDirections;
            document.getElementById('tglProgram').checked = WEDDING_CONFIG.features.showProgram;
            document.getElementById('tglScripture').checked = WEDDING_CONFIG.features.showScripture;
            document.getElementById('tglCountdown').checked = WEDDING_CONFIG.features.showCountdown;
            document.getElementById('tglRSVP').checked = WEDDING_CONFIG.features.showRSVP;
            document.getElementById('tglMusic').checked = WEDDING_CONFIG.features.enableMusic;
            document.getElementById('tglCalendar').checked = WEDDING_CONFIG.features.enableCalendar;
        }

        /* =========================================================
           SECTION COLLAPSE TOGGLE
           ========================================================= */
        function toggleSectionCollapse(sectionId) {
            const content = document.getElementById(sectionId);
            const icon = document.getElementById(`${sectionId}-icon`);
            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                icon.classList.remove('rotate-180');
            } else {
                content.classList.add('collapsed');
                icon.classList.add('rotate-180');
            }
        }

        /* =========================================================
           CUSTOMIZER PANEL TOGGLE
           ========================================================= */
        function toggleCustomizer() {
            const drawer = document.getElementById('customizerDrawer');
            const backdrop = document.getElementById('customizerBackdrop');
            if (drawer.classList.contains('translate-x-full')) {
                drawer.classList.remove('translate-x-full');
                backdrop.classList.remove('opacity-0', 'pointer-events-none');
            } else {
                drawer.classList.add('translate-x-full');
                backdrop.classList.add('opacity-0', 'pointer-events-none');
            }
        }

        /* =========================================================
           CONFIG EXPORT / RESET
           ========================================================= */
        function exportJSON() {
            const configStr = JSON.stringify(WEDDING_CONFIG, null, 2);
            const blob = new Blob([configStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'config.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        async function resetConfig() {
            if (!confirm('Discard current edits and reload config.json?')) return;
            try {
                await loadConfig();
                populateCustomizerInputs();
                renderProgramEvents();
                renderPaletteEditor();
                renderThemeColors();
                renderRSVPFormOptions();
                renderDressCodePalette();
                renderProgramTimeline();
                applyThemeColors();
                refreshMap();
                applyFeatureToggles();
                renderInitialPage();
            } catch (error) {
                alert(`Could not reload config.json: ${error.message}`);
            }
        }

        // Handle import button
        document.getElementById('importFile').onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const imported = JSON.parse(evt.target.result);
                    if (!imported || typeof imported !== 'object' || !imported.couple || !imported.wedding || !imported.venue || !imported.content || !imported.theme || !imported.features || !imported.calendar) throw new Error('The JSON file does not contain a complete wedding configuration.');
                    WEDDING_CONFIG = imported;
                    populateCustomizerInputs();
                    renderProgramEvents();
                    renderPaletteEditor();
                    renderThemeColors();
                    renderRSVPFormOptions();
                    renderDressCodePalette();
                    renderProgramTimeline();
                    applyThemeColors();
                    refreshMap();
                    applyFeatureToggles();
                    renderInitialPage();
                    alert('Configuration imported successfully!');
                } catch(err) {
                    alert('Error parsing JSON file: ' + err.message);
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        };

        /* =========================================================
           MOBILE DEVICE FRAME TOGGLE
           ========================================================= */
        let isDeviceView = false;
        function toggleDeviceView() {
            const container = document.getElementById('mainContainer');
            const btn = document.getElementById('viewToggleBtn');
            isDeviceView = !isDeviceView;
            if (isDeviceView) {
                container.classList.add('device-preview-mode');
                btn.classList.add('bg-lavender-300', 'text-wine-900');
            } else {
                container.classList.remove('device-preview-mode');
                btn.classList.remove('bg-lavender-300', 'text-wine-900');
            }
        }

        /* =========================================================
           WEB AUDIO CHURCH CHIME SYNTHESIZER
           ========================================================= */
        let audioCtx = null;
        let isPlaying = false;
        let chimeInterval = null;

        function toggleAudio() {
            const icon = document.getElementById('musicIcon');
            const btn = document.getElementById('musicToggle');
            if (!isPlaying) {
                if (!audioCtx) audioCtx = new window.AudioContext();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                startChurchChimes();
                isPlaying = true;
                icon.className = 'fa-solid fa-volume-high text-wine-800';
                btn.classList.add('ring-2', 'ring-lavender-400');
            } else {
                stopChurchChimes();
                isPlaying = false;
                icon.className = 'fa-solid fa-church';
                btn.classList.remove('ring-2', 'ring-lavender-400');
            }
        }

        function playBellChime(freq, duration) {
            if (!audioCtx) return;
            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + duration);
            } catch(e) { console.log(e); }
        }

        function startChurchChimes() {
            const chimeNotes = [523.25, 659.25, 587.33, 392.00, 523.25, 587.33, 659.25, 523.25];
            let idx = 0;
            playBellChime(chimeNotes[0], 3.0);
            chimeInterval = setInterval(() => {
                idx = (idx + 1) % chimeNotes.length;
                playBellChime(chimeNotes[idx], 3.0);
            }, 1500);
        }

        function stopChurchChimes() {
            if (chimeInterval) clearInterval(chimeInterval);
        }
