import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

declare const gsap: any;
// FIX: Declare TextPlugin to inform TypeScript that it exists in the global scope.
declare const TextPlugin: any;

// --- Smooth Scroll Logic ---
const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollData = useRef({
        ease: 0.08,
        current: 0,
        target: 0,
    }).current;

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        let animationFrameId: number;

        const setBodyHeight = () => {
            document.body.style.height = `${scrollContainer.scrollHeight}px`;
        };
        
        const onScroll = () => {
            scrollData.target = window.scrollY;
        };

        const smoothScrollLoop = () => {
            scrollData.current += (scrollData.target - scrollData.current) * scrollData.ease;
            
            if (Math.abs(scrollData.target - scrollData.current) < 0.5) {
                scrollData.current = scrollData.target;
            }

            if (scrollContainer) {
                scrollContainer.style.transform = `translate3d(0, ${-scrollData.current}px, 0)`;
            }

            animationFrameId = requestAnimationFrame(smoothScrollLoop);
        };
        
        setBodyHeight();
        const resizeObserver = new ResizeObserver(setBodyHeight);
        if (scrollContainer) {
            resizeObserver.observe(scrollContainer);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', setBodyHeight);
        
        animationFrameId = requestAnimationFrame(smoothScrollLoop);
        
        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', setBodyHeight);
            document.body.style.height = '';
        };
    }, []);

    return (
        <div ref={scrollContainerRef} className="smooth-scroll-container">
            {children}
        </div>
    );
};


// --- Particle Logic for Hero Animation ---
class Particle {
    el: SVGCircleElement;
    size: number;
    startTime: number;
    lifespan: number = 18000; // 18 seconds

    constructor(x: number, y: number, size: number, wrapper: SVGElement, startTime: number) {
        this.size = size;
        this.startTime = startTime;
        
        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.el.setAttribute('cx', String(x));
        this.el.setAttribute('cy', String(y));
        this.el.setAttribute('fill', '#fff');
        
        wrapper.prepend(this.el);
    }
    
    update(now: number) {
        const elapsed = now - this.startTime;
        const progress = elapsed / this.lifespan;

        // Animation: grow fast, then shrink slowly
        const peakTime = 0.1; // time to reach full size
        let currentSize;
        if (progress < peakTime) {
            currentSize = this.size * (progress / peakTime);
        } else {
            currentSize = this.size * (1 - (progress - peakTime) / (1 - peakTime));
        }

        this.el.setAttribute('r', String(Math.max(0, currentSize)));
    }

    isDead(now: number) {
        return now - this.startTime > this.lifespan;
    }

    remove() {
        this.el.remove();
    }
}

// --- Translations & Data ---
const translations = {
  en: {
    navServices: 'Services',
    navAbout: 'About',
    navContact: 'Contact',
    heroLine2: 'Systems for Digital Recognition',
    heroLine3Options: ['Creative Development', 'User-Centric Design', 'Performance Driven'],
    heroSubheading: 'We build beautiful, high-performance coded websites and systems that define your digital presence.',
    servicesTitle: 'Services',
    aboutTitle: 'About Us',
    aboutP1: 'We are an emerging brand founded in Mexico, consisting of developers passionate about building digital experiences that are both functional and beautiful. Our philosophy merges design principles with the precision and logic of code.',
    aboutP2: 'The result is clean, impactful, and built to last.',
    dragMe: '(drag us)',
    showcaseTitle: 'Client Showcase',
    showcasePrev: 'Previous testimonial',
    showcaseNext: 'Next testimonial',
    ideaTitle: 'Spark an Idea',
    ideaSubheading: 'Not sure where to start? Let our AI brainstorm for you.',
    ideaBizTypePlaceholder: 'e.g., Pizzeria, Coffee Shop...',
    ideaGoalPlaceholder: 'e.g., Get more online orders...',
    ideaButton: 'Generate Ideas',
    ideaLoading: 'Generating...',
    ideaResultsTitle: 'Here are a few ideas:',
    ideaCta: 'Ready to bring this to life? We can build that.',
    ideaValidationError: 'Please fill out both fields.',
    contactTitle: 'Get In Touch',
    contactSubheading: 'Have a project in mind? Let\'s talk.',
    contactWhatsapp: "Book a call!",
    contactEmail: 'Send an Email',
    footerText: `© ${new Date().getFullYear()} Kvadra. All rights reserved.`,
    modalClose: 'Close modal',
    learnMore: 'Learn More'
  },
  es: {
    navServices: 'Servicios',
    navAbout: 'Nosotros',
    navContact: 'Contacto',
    heroLine2: 'Sistemas para Reconocimiento Digital',
    heroLine3Options: ['Desarrollo Creativo', 'Diseño Centrado en Usuario', 'Rendimiento Excepcional'],
    heroSubheading: 'Construimos sitios web y sistemas codificados, hermosos y de alto rendimiento que definen tu presencia digital.',
    servicesTitle: 'Servicios',
    aboutTitle: 'Nosotros',
    aboutP1: 'Somos una marca emergente fundada en México, integrada por desarrolladores apasionados por crear experiencias digitales funcionales y hermosas. Nuestra filosofía fusiona los principios del diseño con la precisión y lógica del código.',
    aboutP2: 'El resultado es limpio, impactante y construido para durar.',
    dragMe: '(arrástranos)',
    showcaseTitle: 'Casos de Éxito',
    showcasePrev: 'Testimonio anterior',
    showcaseNext: 'Siguiente testimonio',
    ideaTitle: 'Genera una Idea',
    ideaSubheading: '¿No estás seguro por dónde empezar? Deja que nuestra IA piense por ti.',
    ideaBizTypePlaceholder: 'Ej. Pizzería, Cafetería...',
    ideaGoalPlaceholder: 'Ej. Conseguir más pedidos online...',
    ideaButton: 'Generar Ideas',
    ideaLoading: 'Generando...',
    ideaResultsTitle: 'Aquí tienes algunas ideas:',
    ideaCta: '¿Listo para darle vida a esto? Podemos construirlo.',
    ideaValidationError: 'Por favor, rellena ambos campos.',
    contactTitle: 'Ponte en Contacto',
    contactSubheading: '¿Tienes un proyecto en mente? Hablemos.',
    contactWhatsapp: 'Agenda una llamada!',
    contactEmail: 'Enviar un Email',
    footerText: `© ${new Date().getFullYear()} Kvadra. Todos los derechos reservados.`,
    modalClose: 'Cerrar modal',
    learnMore: 'Saber Más'
  }
};

const servicesData = [
    {
        id: 'seo-digital-strategy',
        title: { en: 'SEO & Digital Strategy', es: 'SEO y Estrategia Digital' },
        description: { 
            en: 'We help your restaurant or local business get discovered. Our digital strategy focuses on what matters: appearing in local searches, attracting nearby customers, and building a strong online reputation. We manage your online presence so you can focus on running your business.',
            es: 'Ayudamos a que tu restaurante o negocio local sea descubierto. Nuestra estrategia digital se enfoca en lo que importa: aparecer en búsquedas locales, atraer clientes cercanos y construir una sólida reputación en línea. Gestionamos tu presencia en internet para que puedas concentrarte en tu negocio.'
        },
        tags: {
            en: ['Local SEO', 'Analytics', 'Content Strategy'],
            es: ['SEO Local', 'Analíticas', 'Estrategia de Contenido']
        }
    },
    {
        id: 'enterprise-web-systems',
        title: { en: 'Custom Business Systems', es: 'Sistemas de Negocio a Medida' },
        description: { 
            en: 'We design and build custom systems to streamline your business operations. Whether it\'s an innovative database to manage inventory, a booking system for your restaurant, or a client portal, we create secure and efficient solutions tailored to your specific needs.',
            es: 'Diseñamos y construimos sistemas a medida para optimizar las operaciones de tu negocio. Ya sea una base de datos innovadora para gestionar inventario, un sistema de reservas para tu restaurante o un portal para clientes, creamos soluciones seguras y eficientes adaptadas a tus necesidades específicas.'
        },
        tags: {
            en: ['Automation', 'Databases', 'CRM'],
            es: ['Automatización', 'Bases de Datos', 'CRM']
        }
    },
    {
        id: 'custom-ui-ux-design',
        title: { en: 'Custom Website Design', es: 'Diseño Web Personalizado' },
        description: {
            en: 'We craft beautiful, user-friendly websites that make a great first impression. For restaurants, we design intuitive online menus and seamless ordering experiences. For businesses, we create professional sites that clearly communicate your value and make it easy for customers to connect with you.',
            es: 'Creamos sitios web hermosos y fáciles de usar que causan una excelente primera impresión. Para restaurantes, diseñamos menús en línea intuitivos y experiencias de pedido fluidas. Para negocios, creamos sitios profesionales que comunican claramente tu valor y facilitan el contacto con los clientes.'
        },
        tags: {
            en: ['UI/UX', 'Web Development', 'Responsive Design'],
            es: ['UI/UX', 'Desarrollo Web', 'Diseño Responsivo']
        }
    },
    {
        id: 'brand-identity',
        title: { en: 'Brand Identity', es: 'Identidad de Marca' },
        description: {
            en: 'Your brand is your story. We help you create a memorable identity, from a unique logo to a consistent look and feel across your website and social media. We ensure your business looks professional and stands out, helping you connect with your ideal customers.',
            es: 'Tu marca es tu historia. Te ayudamos a crear una identidad memorable, desde un logotipo único hasta una apariencia coherente en tu sitio web y redes sociales. Nos aseguramos de que tu negocio se vea profesional y se destaque, ayudándote a conectar con tus clientes ideales.'
        },
        tags: {
            en: ['Logo Design', 'Visual System', 'Strategy'],
            es: ['Diseño de Logo', 'Sistema Visual', 'Estrategia']
        }
    },
    {
        id: 'performance-optimization',
        title: { en: 'Performance Optimization', es: 'Optimización de Rendimiento' },
        description: {
            en: 'A fast website is crucial. We make sure your site loads quickly on all devices, so you don\'t lose customers due to slow speeds. A faster site improves user experience, helps with search engine rankings, and keeps your visitors engaged.',
            es: 'Un sitio web rápido es crucial. Nos aseguramos de que tu página cargue velozmente en todos los dispositivos, para que no pierdas clientes por lentitud. Un sitio más rápido mejora la experiencia del usuario, ayuda en el posicionamiento en buscadores y mantiene a tus visitantes interesados.'
        },
        tags: {
            en: ['Core Web Vitals', 'Caching', 'CDN'],
            es: ['Core Web Vitals', 'Caché', 'CDN']
        }
    }
];

const clientData = [
    {
        name: 'KOR Activewear',
        title: { en: 'Owner', es: 'Propietario' },
        quote: { 
            en: 'Kvadra created the whole website and management system for our brand, they implemented an interactive interface to change and edit our website in real time.',
            es: 'Kvadra creó todo el sitio web y el sistema de gestión para nuestra marca, implementaron una interfaz interactiva para cambiar y editar nuestro sitio web en tiempo real.'
        },
        logo: '🍽️'
    },
    {
        name: 'FOCCA Restaurant',
        title: { en: 'Founder', es: 'Fundadores' },
        quote: { 
            en: 'Working with them with our brand website was amazing and incredibly fast, before we even made a call they already had a working mockup for the website.',
            es: 'Trabajar con ellos en el sitio web de nuestra marca fue increíble e increíblemente rápido, antes de que siquiera hiciéramos una llamada, ya tenían una maqueta funcional del sitio web.'
        },
        logo: '🌿'
    },
    {
        name: 'Innovate Logistics',
        title: { en: 'Operations Manager', es: 'Gerente de Operaciones' },
        quote: { 
            en: 'The custom inventory management system they developed is a game-changer. It has saved us countless hours and reduced errors significantly. Highly recommended.',
            es: 'El sistema de gestión de inventario personalizado que desarrollaron cambió las reglas del juego. Nos ha ahorrado incontables horas y ha reducido los errores significativamente. Muy recomendados.'
        },
        logo: '📦'
    },
];

// --- React Components ---
const Hero = ({ t, lang }) => {
    const wrapperRef = useRef<SVGGElement>(null);
    const mouse = useRef({ x: 0, y: 0, smoothX: 0, smoothY: 0, diff: 0 }).current;
    const particles = useRef<Particle[]>([]).current;
    const taglineRef = useRef(null);
    const codedWordRef = useRef(null);
    
    useEffect(() => {
        let animationFrameId: number;
        
        const onMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener('mousemove', onMouseMove);

        const render = () => {
            mouse.smoothX += (mouse.x - mouse.smoothX) * 0.1;
            mouse.smoothY += (mouse.y - mouse.smoothY) * 0.1;
            mouse.diff = Math.hypot(mouse.x - mouse.smoothX, mouse.y - mouse.smoothY);

            // Emit new particle
            if (mouse.diff > 0.1 && wrapperRef.current) {
                const size = Math.min(mouse.diff * 1.5, 150);
                particles.push(new Particle(mouse.smoothX, mouse.smoothY, size, wrapperRef.current, Date.now()));
            }

            // Update and remove old particles
            const now = Date.now();
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                if (p.isDead(now)) {
                    p.remove();
                    particles.splice(i, 1);
                } else {
                    p.update(now);
                }
            }
            
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationFrameId);
            particles.forEach(p => p.remove());
            particles.length = 0;
        };
    }, [mouse, particles]);

    useEffect(() => {
        gsap.registerPlugin(TextPlugin);

        // TAGLINE ANIMATION
        const taglineEl = taglineRef.current;
        let taglineTl;
        if (taglineEl && t.heroLine3Options?.length > 1) {
            taglineTl = gsap.timeline({ repeat: -1 });
            const cycleOptions = [...t.heroLine3Options.slice(1), t.heroLine3Options[0]];
            cycleOptions.forEach((text) => {
                taglineTl.to(taglineEl, { duration: 0.5, opacity: 0, ease: "power1.in", delay: 3.5 })
                         .set(taglineEl, { text: text })
                         .to(taglineEl, { duration: 0.5, opacity: 1, ease: "power1.out" });
            });
        }

        // CODED WORD ANIMATION
        const codedWordEl = codedWordRef.current;
        const wordToAnimate = lang === 'en' ? 'coded' : 'codificados';
        let glitchTl: any, colorTl: any;
        if (codedWordEl) {
            glitchTl = gsap.timeline({ repeat: -1, repeatDelay: 4, delay: 1 });
            glitchTl.to(codedWordEl, {
                duration: 0.5,
                text: { value: "#?@!&", delimiter: "" },
                ease: "none"
            }).to(codedWordEl, {
                duration: 0.5,
                text: wordToAnimate,
                ease: "none"
            }, "+=0.1");

            colorTl = gsap.timeline({ repeat: -1, yoyo: true });
            colorTl.to(codedWordEl, { color: 'var(--color-primary)', duration: 1.5, ease: 'steps(1)'})
                   .to(codedWordEl, { color: 'var(--color-secondary)', duration: 1.5, ease: 'steps(1)'})
                   .to(codedWordEl, { color: '#4a90e2', duration: 1.5, ease: 'steps(1)'});
        }
        
        // Cleanup function to kill all timelines
        return () => {
            if (taglineTl) taglineTl.kill();
            if (glitchTl) glitchTl.kill();
            if (colorTl) colorTl.kill();
        }

    }, [t.heroLine3Options, lang]);
    
    const wordToAnimate = lang === 'en' ? 'coded' : 'codificados';
    const subheadingParts = t.heroSubheading.split(wordToAnimate);

    return (
        <section className="hero">
            <div className="hero-background"></div>
            <div className="hero-overlay">
                <div className="hero-content">
                    <h1>
                        <span>Kvadra</span>
                        <span>{t.heroLine2}</span>
                        {t.heroLine3Options && <span ref={taglineRef} className="hero-tagline-animated">{t.heroLine3Options[0]}</span>}
                    </h1>
                    <p className="hero-subheading">
                        {subheadingParts[0]}
                        <span className="animated-word" ref={codedWordRef}>{wordToAnimate}</span>
                        {subheadingParts[1]}
                    </p>
                </div>
            </div>
            
            <svg className="goo-svg" aria-hidden="true">
                <defs>
                    {/* Conditional filter based on screen size */}
                    <filter id="gooey">
                        <feGaussianBlur 
                            in="SourceGraphic" 
                            stdDeviation={window.innerWidth < 768 ? "10" : "25"} 
                        />
                        <feColorMatrix 
                            type="matrix" 
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -7" 
                        />
                    </filter>
                    <mask id="mask">
                        <g ref={wrapperRef}></g>
                    </mask>
                </defs>
            </svg>
        </section>
    );
};

const Header = ({ t, onLanguageToggle, lang, onNavClick, theme, onThemeToggle, isVisible }) => (
    <header className={`site-header ${!isVisible ? 'site-header--hidden' : ''}`}>
        <div className="header-controls">
            <button onClick={onThemeToggle} className="theme-switcher" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                <svg className="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 1h2v3h-2V1zm0 19h2v3h-2v-3zM3.515 4.929l1.414-1.414L7.05 5.636 5.636 7.05 3.515 4.93zM16.95 18.364l1.414-1.414L20.485 19.07l-1.414 1.414-2.121-2.121zM1 11h3v2H1v-2zm19 0h3v2h-3v-2zM5.636 16.95l1.414 1.414-2.121 2.121-1.414-1.414L5.636 16.95zM18.364 3.515l1.414 1.414-2.121 2.121-1.414-1.414L18.364 3.515z" fill="currentColor"/></svg>
                <svg className="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M10 7a7 7 0 0 0 12 4.9v.1c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2h.1A6.979 6.979 0 0 0 10 7zm-6 5a8 8 0 0 0 15.062 3.762A9 9 0 0 1 8.238 4.938 7.999 7.999 0 0 0 4 12z" fill="currentColor"/></svg>
            </button>
            <button onClick={onLanguageToggle} className="language-switcher">
                {lang === 'en' ? 'ES' : 'EN'}
            </button>
        </div>
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            Kvadra
        </a>
        <nav>
            <a href="#services" onClick={(e) => { e.preventDefault(); onNavClick('#services'); }}>{t.navServices}</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); onNavClick('#about'); }}>{t.navAbout}</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); onNavClick('#contact'); }}>{t.navContact}</a>
        </nav>
    </header>
);

const Services = ({ t, lang }) => {
    const servicesTitleRef = useRef(null);
    const [openServiceId, setOpenServiceId] = useState(servicesData[0].id);
    const iconRefs = useRef<{ [key: string]: SVGLineElement | null }>({});

    useEffect(() => {
        // Set initial state for the default open item's icon
        if (openServiceId && iconRefs.current[openServiceId]) {
            gsap.set(iconRefs.current[openServiceId], { rotation: 90, transformOrigin: 'center center' });
        }
    }, []); // Run only once on mount

    const handleToggle = (id: string) => {
        const newOpenId = openServiceId === id ? null : id;

        // Animate previously open item to close, if it exists and is different
        if (openServiceId && openServiceId !== id) {
            gsap.to(iconRefs.current[openServiceId], {
                rotation: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                transformOrigin: 'center center'
            });
        }

        // Animate the clicked item based on its new state
        if (newOpenId) { // Opening
            gsap.to(iconRefs.current[id], {
                rotation: 90,
                duration: 0.6,
                ease: 'power2.inOut',
                transformOrigin: 'center center'
            });
        } else { // Closing
            gsap.to(iconRefs.current[id], {
                rotation: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                transformOrigin: 'center center'
            });
        }
        
        setOpenServiceId(newOpenId);
    };


    useEffect(() => {
        const titleEl = servicesTitleRef.current;
        if (titleEl) {
            const masterTl = gsap.timeline({ repeat: -1, repeatDelay: 5, delay: 0.5 });

            masterTl.to(titleEl, {
                duration: 1.0,
                text: {
                    value: "!#$&*?%",
                    delimiter: ""
                },
                ease: "none"
            })
            .to(titleEl, {
                duration: 1.0,
                text: t.servicesTitle,
                ease: "none"
            }, "+=0.2");
        }
    }, [t.servicesTitle]);

    return (
        <section id="services" className="content-section">
            <h2 className="section-title">
                <span ref={servicesTitleRef}>{t.servicesTitle}</span>
            </h2>
            <div className="services-accordion">
                {servicesData.map((service, index) => {
                    const isOpen = openServiceId === service.id;
                    const contentId = `service-content-${service.id}`;
                    const headerId = `service-header-${service.id}`;

                    return (
                        <div className="service-item" key={service.id}>
                            <h3 id={headerId} className="service-item-heading">
                                <button
                                    className="service-item-header"
                                    onClick={() => handleToggle(service.id)}
                                    aria-expanded={isOpen}
                                    aria-controls={contentId}
                                >
                                    <span className="service-number">({String(index + 1).padStart(3, '0')})</span>
                                    <span className="service-item-title">{service.title[lang]}</span>
                                    <svg className="service-toggle-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        {/* FIX: The ref callback must return void or a cleanup function. Wrapping the assignment in braces ensures it returns undefined, satisfying the type checker. */}
                                        <line ref={el => { iconRefs.current[service.id] = el; }} x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </button>
                            </h3>
                            <div
                                id={contentId}
                                role="region"
                                aria-labelledby={headerId}
                                className="service-item-content-wrapper"
                                style={{ maxHeight: isOpen ? '500px' : '0' }}
                            >
                                <div className="service-item-content">
                                    <div className="service-content-inner">
                                        <p className="service-description">{service.description[lang]}</p>
                                        <div className="service-tags">
                                            {service.tags[lang].map(tag => (
                                                <span key={tag} className="service-tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};


const initialShapes = [
    { id: 1, className: 'shape shape-1', style: { top: '0%', left: '20%' } },
    { id: 2, className: 'shape shape-2', style: { top: '50%', left: '0%' } },
    { id: 3, className: 'shape shape-3', style: { top: '70%', left: '75%' } },
];

const About = ({ t }) => {
    const aboutTitleRef = useRef(null);
    const [shapes, setShapes] = useState(initialShapes);
    const [draggedShape, setDraggedShape] = useState({ index: null, offsetX: 0, offsetY: 0 });
    const visualsRef = useRef(null);

    useEffect(() => {
        const titleEl = aboutTitleRef.current;
        if (titleEl) {
            const masterTl = gsap.timeline({ repeat: -1, repeatDelay: 5, delay: 1 });

            masterTl.to(titleEl, {
                duration: 1.0,
                text: {
                    value: "!#$&*?%",
                    delimiter: ""
                },
                ease: "none"
            })
            .to(titleEl, {
                duration: 1.0,
                text: t.aboutTitle,
                ease: "none"
            }, "+=0.2");
        }
    }, [t.aboutTitle]);

    const handleMouseDown = (e, index) => {
        e.preventDefault();
        const shapeEl = e.currentTarget;
        const shapeRect = shapeEl.getBoundingClientRect();
        
        setDraggedShape({
            index,
            offsetX: e.clientX - shapeRect.left,
            offsetY: e.clientY - shapeRect.top,
        });
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (draggedShape.index === null || !visualsRef.current) return;
            
            const containerRect = visualsRef.current.getBoundingClientRect();
            let newX = e.clientX - containerRect.left - draggedShape.offsetX;
            let newY = e.clientY - containerRect.top - draggedShape.offsetY;

            setShapes(currentShapes =>
                currentShapes.map((shape, i) => {
                    if (i === draggedShape.index) {
                        return {
                            ...shape,
                            style: {
                                left: `${newX}px`,
                                top: `${newY}px`,
                            }
                        };
                    }
                    return shape;
                })
            );
        };

        const handleMouseUp = () => {
            setDraggedShape({ index: null, offsetX: 0, offsetY: 0 });
        };

        if (draggedShape.index !== null) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.classList.add('is-dragging');
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('is-dragging');
        };
    }, [draggedShape]);

    return (
        <section id="about" className="content-section about-section">
             <h2 className="section-title">
                <span ref={aboutTitleRef}>{t.aboutTitle}</span>
             </h2>
             <div className="about-content">
                <div className="about-text">
                    <p>{t.aboutP1}</p>
                    <p>{t.aboutP2}</p>
                </div>
                <div className="about-visuals" ref={visualsRef}>
                    <span className="drag-me-hint">{t.dragMe}</span>
                     {shapes.map((shape, index) => (
                         <div 
                            key={shape.id} 
                            className={`${shape.className} ${draggedShape.index === index ? 'dragging' : ''}`}
                            style={shape.style}
                            onMouseDown={(e) => handleMouseDown(e, index)}
                         />
                    ))}
                </div>
            </div>
        </section>
    );
};

const ClientShowcase = ({ t, lang }) => {
    const showcaseTitleRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        const titleEl = showcaseTitleRef.current;
        if (titleEl) {
            const masterTl = gsap.timeline({ repeat: -1, repeatDelay: 5, delay: 1.5 });

            masterTl.to(titleEl, {
                duration: 1.0,
                text: {
                    value: "!#$&*?%",
                    delimiter: ""
                },
                ease: "none"
            })
            .to(titleEl, {
                duration: 1.0,
                text: t.showcaseTitle,
                ease: "none"
            }, "+=0.2");
        }
    }, [t.showcaseTitle]);

    const nextSlide = () => {
        setCurrentIndex(prev => (prev === clientData.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex(prev => (prev === 0 ? clientData.length - 1 : prev - 1));
    };

    useEffect(() => {
        if (!isHovered) {
            intervalRef.current = window.setInterval(() => {
                nextSlide();
            }, 5000);
        }

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
            }
        };
    }, [isHovered, currentIndex]);

    return (
        <section id="showcase" className="content-section client-showcase-section">
            <h2 className="section-title">
                <span ref={showcaseTitleRef}>{t.showcaseTitle}</span>
            </h2>
            <div 
                className="showcase-deck"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {clientData.map((client, index) => {
                    const offset = (index - currentIndex + clientData.length) % clientData.length;
                    
                    const isFront = offset === 0;
                    const isVisible = offset > 0 && offset < 3; // Show 2 cards behind

                    const style: React.CSSProperties = {
                        transform: 'translateY(50px) scale(0.8) rotate(0deg)', // Default hidden state
                        opacity: 0,
                        zIndex: clientData.length - offset,
                        pointerEvents: isFront ? 'auto' : 'none',
                    };

                    if (isFront) {
                        style.transform = 'translateY(0) scale(1) rotate(0deg)';
                        style.opacity = 1;
                    } else if (isVisible) {
                        const y = offset * -25;
                        const scale = 1 - (offset * 0.1);
                        const rotation = (index - currentIndex) * 6;
                        style.transform = `translateY(${y}px) scale(${scale}) rotate(${rotation}deg)`;
                        style.opacity = 1;
                    }

                    return (
                        <div className="testimonial-card" key={index} style={style}>
                            <div className="client-logo" role="img" aria-label={`${client.name} logo`}>{client.logo}</div>
                            <p className="testimonial-quote">"{client.quote[lang]}"</p>
                            <div className="testimonial-author">
                                <strong>{client.name}</strong>, {client.title[lang]}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="slider-nav">
                <button onClick={prevSlide} aria-label={t.showcasePrev}>&larr;</button>
                <button onClick={nextSlide} aria-label={t.showcaseNext}>&rarr;</button>
            </div>
        </section>
    );
};

const IdeaGenerator = ({ t, lang }) => {
    const [bizType, setBizType] = useState('');
    const [goal, setGoal] = useState('');
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!bizType || !goal) {
            setError(t.ideaValidationError); // Simple validation
            return;
        }
        setError('');
        setLoading(true);
        setIdeas([]);

        const languageInstruction = lang === 'es' ? 'Spanish' : 'English';
        const prompt = `You are a creative digital strategist for a web agency. A potential client has a "${bizType}" and their main goal is to "${goal}". Generate 3 concise, innovative, and actionable ideas for their website or digital system. Each idea should be a single sentence. Frame the ideas as solutions. Respond ONLY with a numbered list. Respond in ${languageInstruction}.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const text = response.text;
            // The model is asked for a numbered list, so we can split by newline.
            const generatedIdeas = text.split('\n').filter(line => line.trim() !== '').map(line => line.replace(/^\d+\.\s*/, ''));
            setIdeas(generatedIdeas);
        } catch (err) {
            console.error("Gemini API error:", err);
            setError('Sorry, we couldn\'t generate ideas at this moment. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="idea-generator" className="content-section idea-generator-section">
            <h2 className="section-title">{t.ideaTitle}</h2>
            <p className="contact-subheading">{t.ideaSubheading}</p>
            <form className="idea-form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <input 
                        type="text" 
                        value={bizType}
                        onChange={(e) => setBizType(e.target.value)}
                        placeholder={t.ideaBizTypePlaceholder}
                        aria-label="Business Type"
                        required
                    />
                    <input 
                        type="text" 
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder={t.ideaGoalPlaceholder}
                        aria-label="Main Goal"
                        required
                    />
                </div>
                <button type="submit" className="cta-button" disabled={loading}>
                    {loading ? t.ideaLoading : t.ideaButton}
                </button>
            </form>
            {error && <p className="error-message">{error}</p>}
            {ideas.length > 0 && (
                <div className="idea-results">
                    <h3>{t.ideaResultsTitle}</h3>
                    <ul>
                        {ideas.map((idea, index) => <li key={index}>{idea}</li>)}
                    </ul>
                    <p className="idea-cta">{t.ideaCta}</p>
                </div>
            )}
        </section>
    );
};


const Contact = ({ t }) => (
    <section id="contact" className="content-section contact-section">
        <h2 className="section-title">{t.contactTitle}</h2>
        <p className="contact-subheading">{t.contactSubheading}</p>
        <div className="contact-actions">
            <a 
                href="https://wa.me/+522215984522" // <-- Replace with your WhatsApp number
                className="cta-button" 
                target="_blank" 
                rel="noopener noreferrer"
            >
                {t.contactWhatsapp}
            </a>
            <a 
                href="mailto:santiagoirigoyen12@hotmail.com" // <-- Replace with your email
                className="cta-button"
            >
                {t.contactEmail}
            </a>
        </div>
    </section>
);

const Footer = ({ t }) => (
    <footer className="site-footer-main">
        <p>{t.footerText}</p>
    </footer>
);

const CustomCursor = () => {
    const cursorOuterRef = useRef<HTMLDivElement>(null);
    const cursorInnerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            if (cursorOuterRef.current && cursorInnerRef.current) {
                gsap.to(cursorOuterRef.current, {
                    x: clientX,
                    y: clientY,
                    duration: 0.4,
                    ease: 'power3.out'
                });
                gsap.to(cursorInnerRef.current, {
                    x: clientX,
                    y: clientY,
                    duration: 0.1,
                    ease: 'power3.out'
                });
            }
        };

        const handleMouseEnter = () => {
            if (cursorOuterRef.current) {
                gsap.to(cursorOuterRef.current, {
                    width: 60,
                    height: 60,
                    duration: 0.3
                });
            }
        };

        const handleMouseLeave = () => {
            if (cursorOuterRef.current) {
                gsap.to(cursorOuterRef.current, {
                    width: 32,
                    height: 32,
                    duration: 0.3
                });
            }
        };

        document.addEventListener('mousemove', onMouseMove);

        const interactiveElements = document.querySelectorAll('a, button, input');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
        });

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            interactiveElements.forEach(el => {
                el.removeEventListener('mouseenter', handleMouseEnter);
                el.removeEventListener('mouseleave', handleMouseLeave);
            });
        };
    }, []);

    return (
        <>
            <div className="custom-cursor-outer" ref={cursorOuterRef}></div>
            <div className="custom-cursor-inner" ref={cursorInnerRef}></div>
        </>
    );
};


const App = () => {
    const [language, setLanguage] = useState('en');
    const [theme, setTheme] = useState('light');
    const mainRef = useRef(null);
    
    const [lastYPos, setLastYPos] = useState(0);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const currentYPos = window.scrollY;
            const isScrollingUp = currentYPos < lastYPos;

            setIsHeaderVisible(isScrollingUp || currentYPos < 100);
            setLastYPos(currentYPos);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastYPos]);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleLanguageToggle = () => {
        setLanguage(prev => (prev === 'en' ? 'es' : 'en'));
    };

    const handleThemeToggle = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };
    
    const handleNavClick = (selector) => {
        const element = document.querySelector(selector);
        // FIX: Cast querySelector result to HTMLElement to access offsetHeight property.
        const header = document.querySelector<HTMLElement>('.site-header');
        if (element) {
            const headerOffset = header ? header.offsetHeight : 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
            window.scrollTo({
                 top: offsetPosition,
                 // behavior: "smooth" // Let the custom smooth scroll handle it
            });
        }
    };

    const t = translations[language];

    return (
        <>
            <CustomCursor />
            <Header t={t} onLanguageToggle={handleLanguageToggle} lang={language} onNavClick={handleNavClick} theme={theme} onThemeToggle={handleThemeToggle} isVisible={isHeaderVisible} />
            <SmoothScroll>
                <main ref={mainRef}>
                    <Hero t={t} lang={language} />
                    <Services t={t} lang={language} />
                    <About t={t} />
                    <ClientShowcase t={t} lang={language} />
                    <IdeaGenerator t={t} lang={language} />
                    <Contact t={t} />
                </main>
                <Footer t={t} />
            </SmoothScroll>
        </>
    );
};


const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);