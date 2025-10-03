import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

declare const gsap: any;
// FIX: Declare TextPlugin to inform TypeScript that it exists in the global scope.
declare const TextPlugin: any;
declare const Flip: any;
declare const CustomEase: any;


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
    lifespan: number = 3000; // 18 seconds

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
        const peakTime = 0.01; // time to reach full size
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
    heroInteractHint: '(hover your cursor or touch the screen)',
    servicesTitle: 'Services',
    aboutTitle: 'About Us',
    aboutP1: 'We are an emerging brand founded in Mexico, consisting of developers passionate about building digital experiences that are both functional and beautiful. Our philosophy merges design principles with the precision and logic of code.',
    aboutP2: 'The result is clean, impactful, and built to last.',
    dragMe: '(drag us)',
    showcaseTitle: 'Client Showcase',
    showcasePrev: 'Previous image',
    showcaseNext: 'Next image',
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
    heroInteractHint: '(pasa el cursor o toca la pantalla)',
    servicesTitle: 'Servicios',
    aboutTitle: 'Nosotros',
    aboutP1: 'Somos una marca emergente fundada en México, integrada por desarrolladores apasionados por crear experiencias digitales funcionales y hermosas. Nuestra filosofía fusiona los principios del diseño con la precisión y lógica del código.',
    aboutP2: 'El resultado es limpio, impactante y construido para durar.',
    dragMe: '(arrástranos)',
    showcaseTitle: 'Casos de Éxito',
    showcasePrev: 'Imagen anterior',
    showcaseNext: 'Siguiente imagen',
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
        quote: { 
            en: 'We created the whole e-commerce website for KOR, an emerging sportswear brand, implemented an interactive interface for the empoyees/director to be able to edit the whole database from their phone.',
            es: 'Creamos todo el sitio web de ecommerce para KOR, una marca de ropa deportiva emergente, implementamos una interfaz interactiva para que los empleados/directores puedan editar toda la base de datos desde su teléfono'
        },
        images: [
            'https://images.unsplash.com/photo-1549476464-373921717541?q=80&w=1887&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1517809292312-5b8b1b01de53?q=80&w=1887&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1614272993243-8b9e69b4226e?q=80&w=1887&auto=format&fit=crop'
        ]
    },
    {
        name: 'OVA Architects',
        quote: { 
            en: 'We designed and developed an elegant, high-end website to showcase their architectural portfolio, driving a 32% increase in qualified client leads and elevating their brand presence in the luxury market.',
            es: 'Diseñamos y desarrollamos un sitio web elegante y premium para exhibir su portafolio arquitectónico, generando un aumento del 32% en clientes potenciales calificados y elevando su presencia de marca en el mercado de lujo.'
        },
        images: [
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1517841380369-114d2a13e2d6?q=80&w=1974&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1552561435-24285ee1105b?q=80&w=1974&auto=format&fit=crop'
        ]
    },
    {
        name: 'Innovate Logistics',
        quote: { 
            en: 'We developed a custom inventory management system that transformed their operations—reducing processing time by 60% and virtually eliminating manual errors.',
            es: 'Desarrollamos un sistema de gestión de inventario personalizado que transformó sus operaciones—reduciendo el tiempo de procesamiento en un 60% y prácticamente eliminando errores manuales.'
        },
        images: [
            'https://images.unsplash.com/photo-1586528116311-06924151d14a?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1573450375685-6ab5b6ba6fac?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1665495472099-b1a1a67a0376?q=80&w=2070&auto=format&fit=crop'
        ]
    },
];

// --- React Components ---
// FIX: Add types for component props to resolve TypeScript errors and improve maintainability.
type Translation = typeof translations['en'];
type Language = 'en' | 'es';

const Hero = React.memo(({ t, lang, isMobile }: { t: Translation; lang: Language, isMobile: boolean }) => {
    const heroSectionRef = useRef<HTMLElement>(null);
    const wrapperRef = useRef<SVGGElement>(null);
    const mouse = useRef({ x: 0, y: 0, smoothX: 0, smoothY: 0, diff: 0 }).current;
    const particles = useRef<Particle[]>([]).current;
    const isMouseInHero = useRef(false);
    const taglineRef = useRef(null);
    const codedWordRef = useRef(null);
    
    useEffect(() => {
        // Disable heavy particle animation on mobile devices for performance.
        if (isMobile) {
            // Ensure any existing particles are removed if resizing from desktop to mobile
            particles.forEach(p => p.remove());
            particles.length = 0;
            return;
        }

        let animationFrameId: number;
        
        const onMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        };
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });

        const heroElement = heroSectionRef.current;
        const onMouseEnter = () => isMouseInHero.current = true;
        const onMouseLeave = () => isMouseInHero.current = false;
        const onTouchStart = () => isMouseInHero.current = true;
        const onTouchEnd = () => isMouseInHero.current = false;

        if (heroElement) {
            heroElement.addEventListener('mouseenter', onMouseEnter);
            heroElement.addEventListener('mouseleave', onMouseLeave);
            heroElement.addEventListener('touchstart', onTouchStart, { passive: true });
        }
        window.addEventListener('touchend', onTouchEnd);

        const render = () => {
            mouse.smoothX += (mouse.x - mouse.smoothX) * 0.1;
            mouse.smoothY += (mouse.y - mouse.smoothY) * 0.1;
            mouse.diff = Math.hypot(mouse.x - mouse.smoothX, mouse.y - mouse.smoothY);

            // Emit new particle only when mouse is moving and inside the hero section
            if (mouse.diff > 0.1 && wrapperRef.current && isMouseInHero.current) {
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
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
             if (heroElement) {
                heroElement.removeEventListener('mouseenter', onMouseEnter);
                heroElement.removeEventListener('mouseleave', onMouseLeave);
                heroElement.removeEventListener('touchstart', onTouchStart);
            }
            cancelAnimationFrame(animationFrameId);
            particles.forEach(p => p.remove());
            particles.length = 0;
        };
    }, [isMobile]);

    useEffect(() => {
        gsap.registerPlugin(TextPlugin);

        // TAGLINE ANIMATION
        const taglineEl = taglineRef.current;
        let taglineTl: any;
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
        <section className="hero" ref={heroSectionRef}>
            <div className="hero-background"></div>
            <div className={`hero-overlay ${isMobile ? 'hero-overlay--mobile' : ''}`}>
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
            
            {!isMobile && <p className="hero-interact-hint">{t.heroInteractHint}</p>}
            
            {!isMobile && (
                <svg className="goo-svg" aria-hidden="true">
                    <defs>
                        {/* High-quality filter for desktop */}
                        <filter id="gooey">
                            <feGaussianBlur 
                                in="SourceGraphic" 
                                stdDeviation="25" 
                            />
                            <feColorMatrix 
                                type="matrix" 
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -7" 
                            />
                        </filter>
                        {/* A lighter, more performant filter for mobile devices */}
                        <filter id="gooey-mobile">
                            <feGaussianBlur
                                in="SourceGraphic"
                                stdDeviation="15"
                            />
                            <feColorMatrix
                                type="matrix"
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -6"
                            />
                        </filter>
                        <mask id="mask">
                            <g ref={wrapperRef}></g>
                        </mask>
                    </defs>
                </svg>
            )}
        </section>
    );
});

const Header = ({ t, onLanguageToggle, lang, onNavClick, theme, onThemeToggle, isVisible }: {
    t: Translation;
    onLanguageToggle: () => void;
    lang: Language;
    onNavClick: (selector: string) => void;
    theme: string;
    onThemeToggle: () => void;
    isVisible: boolean;
}) => (
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

const Services = ({ t, lang }: { t: Translation; lang: Language }) => {
    const servicesTitleRef = useRef(null);
    const [openServiceId, setOpenServiceId] = useState<string | null>(servicesData[0].id);
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

const About = ({ t }: { t: Translation }) => {
    const aboutTitleRef = useRef(null);
    const [shapes, setShapes] = useState(initialShapes);
    const [draggedShape, setDraggedShape] = useState<{ index: number | null, offsetX: number, offsetY: number }>({ index: null, offsetX: 0, offsetY: 0 });
    const visualsRef = useRef<HTMLDivElement>(null);

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

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
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
        const handleMouseMove = (e: MouseEvent) => {
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

const ClientList = ({ t, lang }: { t: Translation, lang: Language }) => {
    const componentRoot = useRef<HTMLDivElement>(null);
    // FIX: Moved hooks to the top level of the component to fix React error #321 (Invalid hook call).
    const activeClientIndex = useRef<number | null>(null);
    const currentImageIndex = useRef(0);
    const activeImageRef = useRef<HTMLImageElement | null>(null);
    const carouselHandlers = useRef<{ handleNext: () => void, handlePrev: () => void } | null>(null);

    useEffect(() => {
        if (!componentRoot.current) return;

        gsap.registerPlugin(CustomEase, Flip);
        CustomEase.create("osmo-ease", "0.625, 0.05, 0, 1");

        gsap.defaults({
            ease: "osmo-ease",
            duration: 0.725
        });

        const listItems = componentRoot.current.querySelectorAll(".main-title__item");
        const imageItems = componentRoot.current.querySelectorAll(".main-img__item");
        const overlayItems = componentRoot.current.querySelectorAll(".overlay-item");
        const overlayNav = componentRoot.current.querySelector(".overlay-nav");
        const navItems = componentRoot.current.querySelectorAll("[data-overlay='nav-item']");
        const closeButton = componentRoot.current.querySelector("[data-overlay='close']");
        const headings = componentRoot.current.querySelectorAll(".main-title");

        let activeListItem: Element | null = null;
        
        function openOverlay(index: number) {
            listItems.forEach(item => item.classList.remove("active"));
            activeListItem = listItems[index];
            activeListItem.classList.add("active");

            const title = activeListItem.querySelector(".main-title");
            if (!title) return;
            const titleState = Flip.getState(title, { props: "fontSize" });

            const image = imageItems[index].querySelector(".image") as HTMLImageElement;
            if (!image) return;
            const imageState = Flip.getState(image);

            const overlayItem = overlayItems[index];
            const content = overlayItem.querySelector(".overlay-row");

            gsap.set(overlayItem, { display: "block", autoAlpha: 1 });
            gsap.fromTo(content, { autoAlpha: 0 }, { autoAlpha: 1, delay: 0.5 });

            const textTarget = overlayItem.querySelector("[data-overlay='text-target']");
            const imgTarget = overlayItem.querySelector("[data-overlay='img-target']");

            if(textTarget) textTarget.appendChild(title);
            if(imgTarget) imgTarget.appendChild(image);
            
            Flip.from(titleState, { duration: 0.725, ease: "osmo-ease" });
            Flip.from(imageState, { duration: 0.725, ease: "osmo-ease" });

            // --- Setup Carousel ---
            activeClientIndex.current = index;
            currentImageIndex.current = 0;
            activeImageRef.current = image;

            const changeImage = (newSrc: string) => {
                const img = activeImageRef.current;
                if (!img) return;
                
                img.style.opacity = '0';
                setTimeout(() => {
                    img.src = newSrc;
                    img.onload = () => {
                        img.style.opacity = '1';
                        img.onload = null;
                    };
                }, 300);
            };

            const handleNext = () => {
                if (activeClientIndex.current === null) return;
                const clientImages = clientData[activeClientIndex.current].images;
                const newIndex = (currentImageIndex.current + 1) % clientImages.length;
                currentImageIndex.current = newIndex;
                changeImage(clientImages[newIndex]);
            };

            const handlePrev = () => {
                if (activeClientIndex.current === null) return;
                const clientImages = clientData[activeClientIndex.current].images;
                const newIndex = (currentImageIndex.current - 1 + clientImages.length) % clientImages.length;
                currentImageIndex.current = newIndex;
                changeImage(clientImages[newIndex]);
            };
            
            const prevButton = overlayItem.querySelector('.carousel-button.prev');
            const nextButton = overlayItem.querySelector('.carousel-button.next');
            if (prevButton && nextButton) {
                prevButton.addEventListener('click', handlePrev);
                nextButton.addEventListener('click', handleNext);
                carouselHandlers.current = { handlePrev, handleNext };
            }
            
            gsap.set(overlayNav,{display: "flex" });
            gsap.fromTo(navItems, { yPercent: 110 }, { yPercent: 0, stagger: 0.1 });
            
            gsap.set(imageItems,{ autoAlpha: 0})
            
            listItems.forEach((listItem, i) => {
                if (i !== index) {
                    const otherTitle = listItem.querySelector(".main-title");
                    gsap.to(otherTitle, { yPercent: 100, autoAlpha: 0, duration: 0.45, delay: 0.2 - i * 0.05 });
                }
            });
        }

        function closeOverlay() {
            if (!activeListItem) return;

            const index = Array.from(listItems).indexOf(activeListItem);
            const overlayItem = overlayItems[index];
            const title = overlayItem.querySelector("[data-overlay='text-target'] .main-title");
            const image = overlayItem.querySelector("[data-overlay='img-target'] .image");
            const overlayContent = overlayItem.querySelector(".overlay-row");

            // --- Teardown Carousel ---
            const prevButton = overlayItem.querySelector('.carousel-button.prev');
            const nextButton = overlayItem.querySelector('.carousel-button.next');
            if (prevButton && nextButton && carouselHandlers.current) {
                prevButton.removeEventListener('click', carouselHandlers.current.handlePrev);
                nextButton.removeEventListener('click', carouselHandlers.current.handleNext);
                carouselHandlers.current = null;
            }
            activeClientIndex.current = null;
            activeImageRef.current = null;

            if (!title || !image || !overlayContent) return;

            const titleState = Flip.getState(title, { props: "fontSize" });
            const imageState = Flip.getState(image);

            gsap.to(navItems, { yPercent: 110, onComplete: () => { if (overlayNav) (overlayNav as HTMLElement).style.display = "none"; } });
            gsap.to(overlayContent, { autoAlpha: 0, onComplete: () => { (overlayItem as HTMLElement).style.display = "none"; } });
            
            const buttonContainer = activeListItem.querySelector(".button");
            if(buttonContainer) buttonContainer.appendChild(title);
            if(imageItems[index]) imageItems[index].appendChild(image);
            gsap.set(imageItems[index], { autoAlpha: 1 });
            // Reset image src to the first one for next time
            (image as HTMLImageElement).src = clientData[index].images[0];

            Flip.from(titleState, { duration: 0.725, ease: "osmo-ease" });
            Flip.from(imageState, { duration: 0.725, ease: "osmo-ease" });

            activeListItem.classList.remove("active");
            activeListItem = null;

            gsap.to(headings, { yPercent: 0, autoAlpha: 1, delay: 0.3, stagger: 0.05 });
        }
        
        const clickListeners: (() => void)[] = [];
        listItems.forEach((listItem, index) => {
            const listener = () => openOverlay(index);
            listItem.addEventListener("click", listener);
            clickListeners.push(() => listItem.removeEventListener('click', listener));
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeOverlay();
        };

        document.addEventListener("keydown", handleKeyDown);
        closeButton?.addEventListener("click", closeOverlay);
        
        const mouseEnterListeners: (()=>void)[] = [];
        listItems.forEach((listItem, i) => {
            const listener = () => {
                gsap.set(imageItems, { autoAlpha: 0 });
                gsap.set(imageItems[i], { autoAlpha: 1 });
            };
            listItem.addEventListener("mouseenter", listener);
            mouseEnterListeners.push(() => listItem.removeEventListener('mouseenter', listener));
        });
        
        // Initial state
        gsap.set(imageItems, { autoAlpha: 0 });
        if(imageItems.length > 0) gsap.set(imageItems[0], { autoAlpha: 1 });


        return () => {
            clickListeners.forEach(remove => remove());
            mouseEnterListeners.forEach(remove => remove());
            document.removeEventListener("keydown", handleKeyDown);
            closeButton?.removeEventListener("click", closeOverlay);
        };

    }, []);

    return (
        <section id="showcase" className="content-section client-list-section" ref={componentRoot}>
            <div className="cloneable">
                <div className="page">
                    <div className="main">
                        <div className="main-col">
                            <div className="main-img__list">
                                {clientData.map((client, index) => (
                                    <div className="main-img__item" key={`img-${index}`}>
                                        <img src={client.images[0]} alt={client.name} className="image" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="main-col">
                            <ul className="main-title__list">
                                {clientData.map((client, index) => (
                                    <li className="main-title__item" key={`title-${index}`}>
                                        <button className="button">
                                            <h2 className="main-title">{client.name}</h2>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="overlay-wrap">
                    {clientData.map((client, index) => (
                        <div className="overlay-item" key={`overlay-${index}`}>
                            <div className="overlay-hero">
                                <div className="overlay-title__wrap" data-overlay="text-target"></div>
                            </div>
                            <div className="overlay-row">
                                <div className="overlay-col col-right">
                                    <div className="client-carousel">
                                        <div className="carousel-image-container" data-overlay="img-target">
                                          {/* Image is dynamically placed here */}
                                        </div>
                                        <button className="carousel-button prev" aria-label={t.showcasePrev}>‹</button>
                                        <button className="carousel-button next" aria-label={t.showcaseNext}>›</button>
                                    </div>
                                </div>
                                <div className="overlay-col col-left">
                                    <p className="paragraph">
                                        "{client.quote[lang]}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="overlay-nav">
                        <div data-overlay="nav-item">
                            <button className="button text" data-overlay="close">{t.modalClose}</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const IdeaGenerator = ({ t, lang }: { t: Translation; lang: Language }) => {
    const [bizType, setBizType] = useState('');
    const [goal, setGoal] = useState('');
    const [ideas, setIdeas] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const handleSubmit = async (e: React.FormEvent) => {
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


const Contact = ({ t }: { t: Translation }) => (
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

const Footer = ({ t }: { t: Translation }) => (
    <footer className="site-footer-main">
        <p>{t.footerText}</p>
    </footer>
);

// FIX: Move SiteContent outside of the App component to prevent re-renders on state change.
// This is critical for preventing the Hero animation from restarting on scroll.
// FIX: Wrap SiteContent in a div and attach the forwarded ref to it. This resolves a subtle TypeScript error by providing a clearer component boundary for the parent `SmoothScroll` component.
const SiteContent = React.memo(React.forwardRef<HTMLDivElement, { t: Translation, lang: Language, isMobile: boolean }>(({ t, lang, isMobile }, ref) => (
    <div ref={ref}>
        <main>
            <Hero t={t} lang={lang} isMobile={isMobile} />
            <Services t={t} lang={lang} />
            <About t={t} />
            <ClientList t={t} lang={lang} />
            <IdeaGenerator t={t} lang={lang} />
            <Contact t={t} />
        </main>
        <Footer t={t} />
    </div>
)));


const App = () => {
    const [language, setLanguage] = useState<Language>('en');
    const [theme, setTheme] = useState('light');
    // FIX: Explicitly type the ref to match the element it will be attached to (`<div>`). `useRef(null)` creates an incompatible ref type for a forwarded ref expecting an HTMLElement.
    const mainRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    const [lastYPos, setLastYPos] = useState(0);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            // On mobile, the header is always visible and doesn't hide on scroll.
            setIsHeaderVisible(true);
            return; // Don't attach the scroll listener.
        }

        // On desktop, attach the scroll listener to hide/show the header.
        const handleScroll = () => {
            const currentYPos = window.scrollY;
            // Using a function with the state setter to get the latest lastYPos without adding it as a dependency.
            setLastYPos(prevYPos => {
                const isScrollingUp = currentYPos < prevYPos;
                setIsHeaderVisible(isScrollingUp || currentYPos < 100);
                return currentYPos;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isMobile]); // Re-run this effect only when the device type changes.

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
    
    const handleNavClick = (selector: string) => {
        const element = document.querySelector(selector);
        // FIX: Cast querySelector result to HTMLElement to access offsetHeight property.
        const header = document.querySelector<HTMLElement>('.site-header');
        if (element) {
            const headerOffset = header ? header.offsetHeight : 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
            window.scrollTo({
                 top: offsetPosition,
                 behavior: isMobile ? "smooth" : "auto"
            });
        }
    };

    const t = translations[language];

    return (
        <>
            <Header t={t} onLanguageToggle={handleLanguageToggle} lang={language} onNavClick={handleNavClick} theme={theme} onThemeToggle={handleThemeToggle} isVisible={isHeaderVisible} />
            {isMobile ? (
                <SiteContent ref={mainRef} t={t} lang={language} isMobile={isMobile} />
            ) : (
                // FIX: The SmoothScroll component requires a `children` prop. Nesting SiteContent within SmoothScroll satisfies this prop requirement, resolving the TypeScript error.
                <SmoothScroll>
                    <SiteContent ref={mainRef} t={t} lang={language} isMobile={isMobile} />
                </SmoothScroll>
            )}
        </>
    );
};


const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);