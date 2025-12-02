// for background 2nd click modal - mirror click
var script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes-mirrorclick@1/mirrorclick.js';
document.body.appendChild(script);



// for no scroll background when modal is open
// when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // on .open-modal click
    document.querySelectorAll('.open_modal').forEach(trigger => {
        trigger.addEventListener('click', function () {
            // on every click
            document.querySelectorAll('body').forEach(target => target.classList.add('no-scroll'));
        });
    });

    // on .close-modal click
    document.querySelectorAll('.close_modal').forEach(trigger => {
        trigger.addEventListener('click', function () {
            // on every click
            document.querySelectorAll('body').forEach(target => target.classList.remove('no-scroll'));

            // Clear redirect flag if user closes sign-in modal without signing in
            localStorage.removeItem('redirectToAddHome');
        });
    });
});




(async function () {
    try {
        const profileButton = document.querySelector('[data-element="profile_button"]');
        const profileButtonDropdown = document.querySelector('[data-element="profile_button_dropdown"]');
        let isPopupOpen = false;

        // Close the dropdown initially
        profileButtonDropdown.style.display = 'none';

        // Function to toggle the dropdown
        const togglePopup = () => {
            isPopupOpen = !isPopupOpen;
            profileButtonDropdown.style.display = isPopupOpen ? 'flex' : 'none';
        };

        // Event listener for profile button click and toggling the dropdown
        profileButton.addEventListener('click', function () {
            togglePopup();
        });

        // Event listener for body click to close the dropdown
        document.body.addEventListener('click', function (evt) {
            if (!profileButton.contains(evt.target) && !profileButtonDropdown.contains(evt.target)) {
                isPopupOpen = false;
                profileButtonDropdown.style.display = 'none';
            }
        });

        // Event listeners to close the popup when buttons inside are clicked
        const popupButtons = profileButtonDropdown.querySelectorAll('[data-element*="Button"]');
        popupButtons.forEach(button => {
            button.addEventListener('click', function () {
                isPopupOpen = false;
                profileButtonDropdown.style.display = 'none';
            });
        });

    } catch (err) {

    }
})();



document.addEventListener('DOMContentLoaded', () => {
    window.Wized = window.Wized || [];
    window.Wized.push(async (Wized) => {

        let userLoadStatus = null;

        // Check if user has a token (is signed in)
        if (Wized.data.c.token) {
            // User has token, wait for Load_user request
            await Wized.requests.waitFor('Load_user');
            userLoadStatus = Wized.data.r.Load_user.status;

            // Check if user should be redirected to add-home after sign-in
            if (userLoadStatus === 200) {
                const shouldRedirect = localStorage.getItem('redirectToAddHome');
                if (shouldRedirect === 'true') {
                    // Clear the flag
                    localStorage.removeItem('redirectToAddHome');
                    // Redirect to add-home page
                    window.location.href = '/host/add-home';
                    return; // Exit early to prevent further execution
                }
            }
        }

        document.querySelectorAll('[data-element="addListing_Button"]').forEach(button => {
            button.addEventListener('click', async function () {
                try {
                    if (userLoadStatus === 200) {
                        // If the user is signed in, navigate to /add-home
                        window.location.href = '/host/add-home';
                    } else {
                        // User is not signed in, set flag to redirect after sign-in
                        localStorage.setItem('redirectToAddHome', 'true');

                        // Show signup wrapper
                        const signupWrapper = document.querySelector('[data-element="signin-wrapper"]');
                        if (signupWrapper) {
                            signupWrapper.style.display = 'flex';
                        }
                    }
                } catch (error) {
                    console.error('Failed to load user:', error);
                }
            });


        });
    });
});


//copy email and phone number to clipboard

document.addEventListener('DOMContentLoaded', () => {
    // Function to copy text to the clipboard
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // Select the email and phone number buttons
    const copyEmailButton = document.querySelector('[data-element="help_copyEmail"]');
    const copyPhoneButton = document.querySelector('[data-element="help_copyPhone"]');

    // Email and phone number to copy
    const email = 'support@keysbooking.com';
    const phoneNumber = '+13053011952';

    // Add click event listeners
    if (copyEmailButton) {
        copyEmailButton.addEventListener('click', () => {
            copyToClipboard(email);
            alert('Email copied to clipboard!');
        });
    }

    if (copyPhoneButton) {
        copyPhoneButton.addEventListener('click', () => {
            copyToClipboard(phoneNumber);
            alert('Phone number copied to clipboard!');
        });
    }
});


// Combined Hero Image & Demo Video Loader
document.addEventListener('DOMContentLoaded', async () => {
    const heroImageElement = document.querySelector('[data-element="becomeAHostHeroImage"]');
    const demoVideoElement = document.querySelector('[data-element="demoVideoElement"]');
    const loaderElement = document.querySelector('[data-element="loader"]');

    // Track loading state
    const loadingState = {
        heroImage: heroImageElement ? false : true, // true if element doesn't exist (nothing to load)
        demoVideo: demoVideoElement ? false : true
    };

    // Function to check if all resources are loaded
    const checkAndHideLoader = () => {
        if (loadingState.heroImage && loadingState.demoVideo) {
            if (loaderElement) {
                loaderElement.style.display = 'none';
            }
        }
    };

    // Keep loader visible initially
    if (loaderElement) {
        loaderElement.style.display = 'flex';
    }

    // Load Hero Image
    if (heroImageElement) {
        try {
            const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/stockimages/1');

            if (!response.ok) {
                throw new Error('Failed to fetch hero image');
            }

            const data = await response.json();

            if (data.image && data.image.url) {
                heroImageElement.onload = () => {
                    loadingState.heroImage = true;
                    checkAndHideLoader();
                };

                heroImageElement.onerror = () => {
                    console.error('Error loading hero image');
                    loadingState.heroImage = true;
                    checkAndHideLoader();
                };

                heroImageElement.src = data.image.url;
                heroImageElement.alt = data.image.name || 'Become a host hero image';
            } else {
                loadingState.heroImage = true;
                checkAndHideLoader();
            }
        } catch (error) {
            console.error('Error fetching hero image:', error);
            loadingState.heroImage = true;
            checkAndHideLoader();
        }
    }

    // Load Demo Video
    if (demoVideoElement) {
        try {
            const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/demovid');

            if (!response.ok) {
                throw new Error('Failed to fetch demo video');
            }

            const data = await response.json();

            if (data && data.length > 0 && data[0].video && data[0].video.url) {
                const videoUrl = data[0].video.url;

                // Check if demoVideoElement is a video tag or a container
                let videoTag, videoContainer;
                if (demoVideoElement.tagName === 'VIDEO') {
                    videoTag = demoVideoElement;
                    videoContainer = demoVideoElement.parentElement;
                } else {
                    // Create a video element and append to container
                    videoTag = document.createElement('video');
                    videoTag.style.width = '100%';
                    videoTag.style.height = '100%';
                    videoTag.style.objectFit = 'cover';
                    videoContainer = demoVideoElement;
                    videoContainer.style.position = 'relative';
                    videoContainer.appendChild(videoTag);
                }

                // Create play button overlay
                const playButton = document.createElement('div');
                playButton.innerHTML = `
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="40" cy="40" r="40" fill="rgba(0, 0, 0, 0.7)"/>
                        <path d="M32 25L55 40L32 55V25Z" fill="white"/>
                    </svg>
                    <div style="margin-top: 12px; color: white; font-size: 16px; font-weight: 500; font-family: 'TT Fors', sans-serif;">Click to Play Demo</div>
                `;
                playButton.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.3s ease;
                    pointer-events: auto;
                `;
                playButton.addEventListener('mouseenter', () => {
                    playButton.style.transform = 'translate(-50%, -50%) scale(1.1)';
                });
                playButton.addEventListener('mouseleave', () => {
                    playButton.style.transform = 'translate(-50%, -50%) scale(1)';
                });

                // Create replay button (hidden initially)
                const replayButton = document.createElement('div');
                replayButton.innerHTML = `
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="25" cy="25" r="25" fill="rgba(0, 0, 0, 0.7)"/>
                        <path d="M25 14C18.92 14 14 18.92 14 25C14 31.08 18.92 36 25 36C29.18 36 32.84 33.66 34.74 30.18L32.26 28.74C30.92 31.26 28.16 33 25 33C20.58 33 17 29.42 17 25C17 20.58 20.58 17 25 17C27.24 17 29.26 17.92 30.74 19.4L27 23H36V14L32.76 17.24C30.68 15.16 27.96 14 25 14Z" fill="white"/>
                    </svg>
                `;
                replayButton.style.cssText = `
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    cursor: pointer;
                    z-index: 10;
                    opacity: 0;
                    transition: all 0.3s ease;
                    pointer-events: none;
                `;
                replayButton.addEventListener('mouseenter', () => {
                    replayButton.style.transform = 'scale(1.1)';
                });
                replayButton.addEventListener('mouseleave', () => {
                    replayButton.style.transform = 'scale(1)';
                });

                // Create fullscreen button (hidden initially)
                const fullscreenButton = document.createElement('div');
                fullscreenButton.innerHTML = `
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="25" cy="25" r="25" fill="rgba(0, 0, 0, 0.7)"/>
                        <path d="M16 21V16H21M34 16H29V16M29 34H34V29M16 29V34H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                    </svg>
                `;
                fullscreenButton.style.cssText = `
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    cursor: pointer;
                    z-index: 10;
                    opacity: 0;
                    transition: all 0.3s ease;
                    pointer-events: none;
                `;
                fullscreenButton.addEventListener('mouseenter', () => {
                    fullscreenButton.style.transform = 'scale(1.1)';
                });
                fullscreenButton.addEventListener('mouseleave', () => {
                    fullscreenButton.style.transform = 'scale(1)';
                });

                videoContainer.appendChild(playButton);
                videoContainer.appendChild(replayButton);
                videoContainer.appendChild(fullscreenButton);

                // CRITICAL: Set muted as property BEFORE src for autoplay to work
                videoTag.muted = true;
                videoTag.playsInline = true;
                videoTag.loop = true;
                videoTag.playbackRate = 0.8; // Slow down to 90% speed

                // Also set as attributes for HTML compliance
                videoTag.setAttribute('muted', '');
                videoTag.setAttribute('playsinline', '');
                videoTag.setAttribute('loop', '');

                let isPlaying = false;

                // Function to play video
                const playVideo = async () => {
                    try {
                        // Start at 30.4 seconds if at the beginning
                        if (videoTag.currentTime < 30.6) {
                            videoTag.currentTime = 30.6;
                        }
                        await videoTag.play();
                        isPlaying = true;
                        playButton.style.opacity = '0';
                        playButton.style.pointerEvents = 'none';
                        replayButton.style.opacity = '1';
                        replayButton.style.pointerEvents = 'auto';
                        fullscreenButton.style.opacity = '1';
                        fullscreenButton.style.pointerEvents = 'auto';
                        console.log('Video playing');
                    } catch (error) {
                        console.error('Error playing video:', error);
                    }
                };

                // Function to replay video
                const replayVideo = () => {
                    videoTag.currentTime = 30.6;
                    playVideo();
                };

                // Create fullscreen modal
                const fullscreenModal = document.createElement('div');
                fullscreenModal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    padding: 20px;
                    box-sizing: border-box;
                `;

                // Create video container for modal (15:8 aspect ratio)
                const modalVideoContainer = document.createElement('div');
                modalVideoContainer.style.cssText = `
                    width: 100%;
                    max-width: 100%;
                    aspect-ratio: 15 / 8;
                    position: relative;
                    background: black;
                `;

                // Create modal video element
                const modalVideo = document.createElement('video');
                modalVideo.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                `;
                modalVideo.muted = true;
                modalVideo.playsInline = true;
                modalVideo.loop = true;
                modalVideo.playbackRate = 0.9;
                modalVideo.setAttribute('muted', '');
                modalVideo.setAttribute('playsinline', '');
                modalVideo.setAttribute('loop', '');

                // Create close button for modal
                const modalCloseButton = document.createElement('div');
                modalCloseButton.innerHTML = `
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="25" cy="25" r="25" fill="rgba(255, 255, 255, 0.9)"/>
                        <path d="M18 18L32 32M32 18L18 32" stroke="black" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                `;
                modalCloseButton.style.cssText = `
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    cursor: pointer;
                    z-index: 100000;
                    transition: all 0.3s ease;
                `;
                modalCloseButton.addEventListener('mouseenter', () => {
                    modalCloseButton.style.transform = 'scale(1.1)';
                });
                modalCloseButton.addEventListener('mouseleave', () => {
                    modalCloseButton.style.transform = 'scale(1)';
                });

                modalVideoContainer.appendChild(modalVideo);
                fullscreenModal.appendChild(modalVideoContainer);
                fullscreenModal.appendChild(modalCloseButton);
                document.body.appendChild(fullscreenModal);

                // Function to open fullscreen modal
                const openFullscreenModal = () => {
                    // Sync video time and playback state
                    modalVideo.src = videoTag.src;
                    modalVideo.currentTime = videoTag.currentTime;

                    fullscreenModal.style.display = 'flex';
                    modalVideo.play();

                    // Pause the original video
                    videoTag.pause();
                };

                // Function to close fullscreen modal
                const closeFullscreenModal = () => {
                    fullscreenModal.style.display = 'none';

                    // Sync back to original video
                    videoTag.currentTime = modalVideo.currentTime;
                    videoTag.play();

                    modalVideo.pause();
                };

                // Close button click handler
                modalCloseButton.addEventListener('click', closeFullscreenModal);

                // Close modal when clicking outside the video
                fullscreenModal.addEventListener('click', (e) => {
                    if (e.target === fullscreenModal) {
                        closeFullscreenModal();
                    }
                });

                // Close modal on Escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && fullscreenModal.style.display === 'flex') {
                        closeFullscreenModal();
                    }
                });

                // Play button click handler
                playButton.addEventListener('click', playVideo);

                // Replay button click handler
                replayButton.addEventListener('click', replayVideo);

                // Fullscreen button click handler
                fullscreenButton.addEventListener('click', openFullscreenModal);

                // Track if video is loaded and ready
                let videoLoaded = false;
                let hasAutoPlayed = false;

                // Wait for video to be ready to play
                videoTag.addEventListener('loadeddata', async () => {
                    loadingState.demoVideo = true;
                    checkAndHideLoader();
                    videoLoaded = true;
                });

                // Use Intersection Observer to detect when video is in view
                const observerOptions = {
                    root: null, // Use viewport
                    threshold: 0.75 // Trigger when 75% of video is visible
                };

                const videoObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        // Video is in view and loaded, and hasn't auto-played yet
                        if (entry.isIntersecting && videoLoaded && !hasAutoPlayed) {
                            hasAutoPlayed = true;

                            // Play immediately when video comes into view
                            (async () => {
                                try {
                                    // Start at 30.4 seconds
                                    videoTag.currentTime = 30.6;
                                    await videoTag.play();
                                    isPlaying = true;
                                    playButton.style.opacity = '0';
                                    playButton.style.pointerEvents = 'none';
                                    replayButton.style.opacity = '1';
                                    replayButton.style.pointerEvents = 'auto';
                                    fullscreenButton.style.opacity = '1';
                                    fullscreenButton.style.pointerEvents = 'auto';
                                    console.log('Video autoplay successful when in view');
                                } catch (playError) {
                                    // Autoplay prevented - show play button
                                    console.log('Autoplay prevented - showing play button');
                                    playButton.style.opacity = '1';
                                    playButton.style.pointerEvents = 'auto';
                                }
                            })();
                        }
                    });
                }, observerOptions);

                // Start observing the video container
                videoObserver.observe(videoContainer);

                // Handle load error
                videoTag.addEventListener('error', () => {
                    console.error('Error loading demo video');
                    loadingState.demoVideo = true;
                    checkAndHideLoader();
                });

                // Set the video source (AFTER muted is set)
                videoTag.src = videoUrl;
                videoTag.load();

            } else {
                console.error('Invalid video data structure');
                loadingState.demoVideo = true;
                checkAndHideLoader();
            }
        } catch (error) {
            console.error('Error fetching demo video:', error);
            loadingState.demoVideo = true;
            checkAndHideLoader();
        }
    }
});


// Founding Partner Count Feature
document.addEventListener('DOMContentLoaded', async () => {
    const spotsClaimedElements = document.querySelectorAll('[data-element="hostLanding_spotsClaimedText"]');

    if (!spotsClaimedElements || spotsClaimedElements.length === 0) return;

    // Add gradient animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes coolGradient {
            0% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0% 50%;
            }
        }
        
        @keyframes strikethrough {
            0% {
                width: 0%;
            }
            100% {
                width: 100%;
            }
        }
        
        @keyframes pulsateGlow {
            0%, 100% {
                transform: scale(1);
                opacity: 1;
            }
            50% {
                transform: scale(1.03);
                opacity: 0.9;
            }
        }
        
        .cool-gradient-text {
            background: linear-gradient(
                90deg,
                #0088cc,
                #0066aa,
                #4b0082,
                #6600cc,
                #0088cc
            );
            background-size: 200% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: coolGradient 3s ease infinite;
            display: inline-block;
            font-weight: 600;
        }
        
        .strikethrough-container {
            position: relative;
            display: inline-block;
        }
        
        .strikethrough-line {
            position: absolute;
            top: 50%;
            left: 0;
            height: 2px;
            background: currentColor;
            width: 0%;
            animation: strikethrough 1s ease-in-out forwards;
        }
        
        .founding-fee-reveal {
            animation: pulsateGlow 2s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);

    // Add cool gradient class to all elements
    spotsClaimedElements.forEach(element => {
        element.classList.add('cool-gradient-text');
    });

    try {
        // Fetch the founding partner count
        const response = await fetch('https://xruq-v9q0-hayo.n7c.xano.io/api:WurmsjHX/hostLanding_foundingPartnerCount');

        if (!response.ok) {
            throw new Error('Failed to fetch founding partner count');
        }

        const count = await response.json();
        const targetNumber = parseInt(count);

        // Animate count from 0 to target number
        const duration = 500; // 0.5 seconds
        const steps = 60; // Number of steps in the animation
        const increment = targetNumber / steps;
        const stepDuration = duration / steps;

        let currentNumber = 0;

        const countInterval = setInterval(() => {
            currentNumber += increment;

            if (currentNumber >= targetNumber) {
                currentNumber = targetNumber;
                clearInterval(countInterval);
            }

            // Update all elements
            spotsClaimedElements.forEach(element => {
                element.textContent = `${Math.floor(currentNumber)} of 100 founding spots claimed 🔒`;
            });
        }, stepDuration);

    } catch (error) {
        console.error('Error fetching founding partner count:', error);
        // Fallback display if fetch fails
        spotsClaimedElements.forEach(element => {
            element.textContent = '__ of 100 founding spots claimed 🔒';
        });
    }
});


// Fee Strikethrough Animation Feature
document.addEventListener('DOMContentLoaded', () => {
    const defaultFeeElements = document.querySelectorAll('[data-element="hostLanding_defaultFee"]');
    const foundingFeeElements = document.querySelectorAll('[data-element="hostLanding_foundingFee"]');
    const foundingFeeContainers = document.querySelectorAll('[data-element="hostLanding_foundingFeeContainer"]');

    // Setup founding fee elements for smooth animation
    foundingFeeElements.forEach((element, index) => {
        element.style.display = 'flex';
        element.style.maxHeight = '0px';
        element.style.opacity = '0';
        element.style.overflow = 'hidden';
        element.style.transition = 'max-height 0.8s ease-in-out, opacity 0.8s ease-in-out, margin 0.8s ease-in-out, padding 0.8s ease-in-out';
    });

    // Wait a moment after page load, then start the animation
    setTimeout(() => {
        // Add strikethrough to default fee elements
        defaultFeeElements.forEach(element => {
            // Wrap the element content if not already wrapped
            if (!element.classList.contains('strikethrough-container')) {
                const content = element.innerHTML;
                element.innerHTML = content;
                element.classList.add('strikethrough-container');

                // Add strikethrough line
                const line = document.createElement('div');
                line.classList.add('strikethrough-line');
                element.appendChild(line);
            }
        });

        // After strikethrough animation completes (1s), show founding fee
        setTimeout(() => {
            foundingFeeElements.forEach((element, index) => {
                // Ensure opacity stays at 0 during measurement
                element.style.opacity = '0';

                // Temporarily remove overflow and max-height to measure natural height
                element.style.overflow = 'visible';
                element.style.maxHeight = 'none';
                const naturalHeight = element.scrollHeight;

                // Reset to collapsed state with opacity 0
                element.style.overflow = 'hidden';
                element.style.maxHeight = '0px';
                element.style.opacity = '0';

                // Force reflow
                element.offsetHeight;

                // Start height animation first
                requestAnimationFrame(() => {
                    element.style.maxHeight = naturalHeight + 'px';
                    element.classList.add('founding-fee-reveal');

                    // Delay opacity fade-in by 200ms to make it more visible
                    setTimeout(() => {
                        element.style.opacity = '1';
                    }, 200);
                });

                // After animation, remove max-height constraint
                setTimeout(() => {
                    element.style.maxHeight = 'none';
                    element.style.overflow = 'visible';
                }, 1000);
            });
        }, 1000);

    }, 500); // Start after 500ms page load
});


// We Add Property Popup Feature
document.addEventListener('DOMContentLoaded', () => {
    const weAddPropertyButtons = document.querySelectorAll('[data-element="hostLanding_weAddProperty"]');

    if (!weAddPropertyButtons || weAddPropertyButtons.length === 0) return;

    // Add popup styles
    const style = document.createElement('style');
    style.textContent = `
        .property-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        }
        
        .property-popup-overlay.active {
            display: flex;
        }
        
        .property-popup {
            background: white;
            border-radius: 5px;
            padding: 32px;
            max-width: 700px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            position: relative;
            animation: popupSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes popupSlideIn {
            0% {
                opacity: 0;
                transform: scale(0.9) translateY(20px);
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        .property-popup-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            border: none;
            background: #f0f0f0;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-family: 'TT Fors', sans-serif;
            color: #666;
            transition: all 0.2s ease;
        }
        
        .property-popup-close:hover {
            background: #e0e0e0;
            color: #000;
            transform: rotate(90deg);
        }
        
        .property-popup h2 {
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
            color: #000;
            font-family: 'TT Fors', sans-serif;
        }
        
        .property-popup p {
            margin: 0 0 24px 0;
            color: #666;
            font-size: 16px;
            line-height: 1.5;
            font-family: 'TT Fors', sans-serif;
        }
        
        .property-popup-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .property-popup-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-family: 'TT Fors', sans-serif;
        }
        
        .property-popup-field label {
            font-size: 16px;
            font-weight: 500;
            color: #333;
            font-family: 'TT Fors', sans-serif;
        }
        
        .property-popup-field input {
            padding: 12px 16px;
            border: 2px solid #e2e2e2;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.2s ease;
            font-family: inherit;
            font-family: 'TT Fors', sans-serif;
        }
        
        .property-popup-field input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            font-family: 'TT Fors', sans-serif;
        }
        
        .property-popup-submit {
            padding: 14px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 8px;
            font-family: 'TT Fors', sans-serif;
        }
        
        .property-popup-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
            font-family: 'TT Fors', sans-serif;
        }
        
        .property-popup-submit:active {
            transform: translateY(0);
            font-family: 'TT Fors', sans-serif;
        }
        
        .property-popup-field small {
            color: #999;
            font-size: 12px;
            font-family: 'TT Fors', sans-serif;
            }
        
        .property-links-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
            background: #f8f8f8;
            border-radius: 8px;
            margin-top: 4px;
        }
        
        .property-links-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .property-links-header label {
            font-size: 14px;
            font-weight: 500;
            color: #333;
        }
        
        .add-property-link-btn {
            padding: 6px 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .add-property-link-btn:hover {
            background: #5568d3;
            transform: translateY(-1px);
        }
        
        .property-link-item {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            padding-top: 20px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e2e2;
        }
        
        .property-link-item input {
            padding: 8px 12px;
            border: 1px solid #e2e2e2;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.2s ease;
            font-family: inherit;
            width: 100%;
        }
        
        .property-link-item input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }
        
        .remove-property-link-btn {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 24px;
            height: 24px;
            padding: 0;
            background: #fee;
            color: #c33;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 16px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .remove-property-link-btn:hover {
            background: #fcc;
            transform: scale(1.15);
        }
        
        .property-links-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .property-links-helper {
            font-size: 12px;
            color: #666;
            margin-top: -8px;
        }
    `;
    document.head.appendChild(style);

    // Create popup HTML
    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'property-popup-overlay';
    popupOverlay.innerHTML = `
        <div class="property-popup">
            <button class="property-popup-close" type="button">×</button>
            <h2>Let Us Add Your Properties</h2>
            <p>We'll handle the listing process for you! Just tell us a bit about your properties.</p>
            <form class="property-popup-form">
                <div class="property-popup-field">
                    <label for="property-count">How many properties do you have?</label>
                    <input 
                        type="number" 
                        id="property-count" 
                        name="property-count" 
                        min="1" 
                        max="999"
                        placeholder="e.g., 5"
                        required
                    />
                </div>
                <div class="property-popup-field">
                    <label for="phone-number">Phone Number <small>(optional)</small></label>
                    <input 
                        type="tel" 
                        id="phone-number" 
                        name="phone-number" 
                        placeholder="(305) 123-4567"
                    />
                    <small>We may call to discuss your properties</small>
                </div>
                <div class="property-popup-field">
                    <div class="property-links-section">
                        <div class="property-links-header">
                            <label>Property Links <small>(optional)</small></label>
                            <button type="button" class="add-property-link-btn">
                                <span>+</span> Add Property Link
                            </button>
                        </div>
                        <div class="property-links-helper">
                            Add links from Airbnb, VRBO, or other platforms
                        </div>
                        <div class="property-links-list"></div>
                    </div>
                </div>
                <button type="submit" class="property-popup-submit">
                    Email Support (opens your email app, prefilled)
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(popupOverlay);

    // Get references
    const popup = popupOverlay.querySelector('.property-popup');
    const closeBtn = popupOverlay.querySelector('.property-popup-close');
    const form = popupOverlay.querySelector('.property-popup-form');
    const propertyCountInput = document.getElementById('property-count');
    const phoneNumberInput = document.getElementById('phone-number');
    const addPropertyLinkBtn = popupOverlay.querySelector('.add-property-link-btn');
    const propertyLinksList = popupOverlay.querySelector('.property-links-list');

    let propertyLinkCounter = 0;

    // Function to create a new property link item
    function addPropertyLink() {
        propertyLinkCounter++;
        const linkItem = document.createElement('div');
        linkItem.className = 'property-link-item';
        linkItem.dataset.id = propertyLinkCounter;
        linkItem.innerHTML = `
            <input 
                type="text" 
                placeholder="Label (e.g., Oceanview Condo)"
                class="property-link-label"
                data-id="${propertyLinkCounter}"
            />
            <input 
                type="url" 
                placeholder="https://airbnb.com/..."
                class="property-link-url"
                data-id="${propertyLinkCounter}"
            />
            <button type="button" class="remove-property-link-btn" data-id="${propertyLinkCounter}">×</button>
        `;
        propertyLinksList.appendChild(linkItem);

        // Focus on label input
        linkItem.querySelector('.property-link-label').focus();

        // Add remove handler
        const removeBtn = linkItem.querySelector('.remove-property-link-btn');
        removeBtn.addEventListener('click', () => {
            linkItem.remove();
        });
    }

    // Add property link button handler
    addPropertyLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addPropertyLink();
    });

    // Open popup when button clicked
    weAddPropertyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            popupOverlay.classList.add('active');
            // Focus on first input after animation
            setTimeout(() => propertyCountInput.focus(), 300);
        });
    });

    // Close popup
    const closePopup = () => {
        popupOverlay.classList.remove('active');
        form.reset();
        // Clear all property links
        propertyLinksList.innerHTML = '';
        propertyLinkCounter = 0;
    };

    closeBtn.addEventListener('click', closePopup);

    // Close when clicking overlay (not popup itself)
    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
            closePopup();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popupOverlay.classList.contains('active')) {
            closePopup();
        }
    });

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const propertyCount = propertyCountInput.value;
        const phoneNumber = phoneNumberInput.value.trim();

        // Collect property links
        const propertyLinks = [];
        const linkItems = propertyLinksList.querySelectorAll('.property-link-item');
        linkItems.forEach(item => {
            const label = item.querySelector('.property-link-label').value.trim();
            const url = item.querySelector('.property-link-url').value.trim();
            if (label || url) {
                propertyLinks.push({ label, url });
            }
        });

        // Create email content
        const subject = `Add My Listing Request - ${propertyCount} ${propertyCount === '1' ? 'Property' : 'Properties'}`;

        let body = `Hello Keys Booking Support Team,\n\n`;
        body += `I would like assistance adding my properties to Keys Booking.\n\n`;
        body += `Number of Properties: ${propertyCount}\n`;

        if (phoneNumber) {
            body += `Phone Number: ${phoneNumber}\n`;
        }

        // Add property links if any
        if (propertyLinks.length > 0) {
            body += `\nProperty Links:\n`;
            propertyLinks.forEach((link, index) => {
                body += `${index + 1}. `;
                if (link.label) {
                    body += `${link.label}`;
                }
                if (link.label && link.url) {
                    body += ` - `;
                }
                if (link.url) {
                    body += `${link.url}`;
                }
                body += `\n`;
            });
        }

        body += `\nPlease contact me to discuss getting my ${propertyCount === '1' ? 'property' : 'properties'} listed on your platform.\n\n`;
        body += `Thank you,`;

        // Encode for mailto link
        const mailtoLink = `mailto:support@keysbooking.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Open email client
        window.location.href = mailtoLink;

        // Close popup after brief delay
        setTimeout(closePopup, 500);
    });
});


