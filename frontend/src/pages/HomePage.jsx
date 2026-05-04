import React, { useState } from "react";
// Imports Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';

// Imports Styles Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

// Ajoute "t" dans les arguments de la fonction
function HomePage({ setPage, t }) {
    const [newsletterEmail, setNewsletterEmail] = useState("");

    // Vérification si on est en français (utile pour certaines alertes)
    const isFR = t.nav_home === "Accueil";

    const filmsData = [
        { id: 1, title: "Cyber Mind", director: "L. Vachon", country: "France", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500" },
        { id: 2, title: "Neon Pulse", director: "J. Doe", country: "USA", poster: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=500" },
        { id: 3, title: "Digital Soul", director: "A. Smith", country: "UK", poster: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=500" },
        { id: 4, title: "Binary Dreams", director: "K. Tanaka", country: "Japan", poster: "https://images.unsplash.com/photo-1540959733332-e94e270b4052?q=80&w=500" },
        { id: 5, title: "AI Rising", director: "M. Muller", country: "Germany", poster: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500" },
        { id: 6, title: "Future Path", director: "P. Costa", country: "Brazil", poster: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=500" }
    ];

    const partners = [
        { name: "ACM", logo: "ACM.png" },
        { name: "MFF", logo: "MFF.png" },
        { name: "NDNP", logo: "UDNP.png" },
        { name: "UNESCO", logo: "UNESCO.png" },
        { name: "LAPLATEFORME", logo: "LAPLATEFORME.png" },
        { name: "CNC", logo: "CNC.png" },
        { name: "EXTRA COURT", logo: "EXTRA.png" },
        { name: "GLOBAL", logo: "GLOBAL.png" },
        { name: "PSL", logo: "PSL.png" },
        { name: "SACD", logo: "SACD.jpg" },
        { name: "ACTION", logo: "ACTION.png" },

    ];

    const handleNewsletterSubmit = () => {
        if (!newsletterEmail) return alert(isFR ? "Veuillez entrer un email" : "Please enter an email");
        alert(isFR ? "Succès ! Vous êtes inscrit." : "Success! You are subscribed.");
        setNewsletterEmail("");
    };

    return (
        <div className="homepage">
            {/* ================= HERO SECTION ================= */}
            <section className="hero">
                <video className="bg-video" autoPlay loop muted playsInline>
                    <source src="./public/internet.mp4" type="video/mp4" />
                </video>
                <div className="hero-overlay" />
                <div className="hero-content">
                    <h1 className="hero-title">MARSIA 2026</h1>
                    {/* Utilisation de t.hero_subtitle ou équivalent */}
                    <p className="hero-subtitle">{isFR ? "Festival International Court-métrage IA" : "International AI Short Film Festival"}</p>
                    <div className="hero-buttons">
                        <button className="btn-primary btn-large" onClick={() => setPage("soumission-film")}>
                            {isFR ? "Participer" : "Join In"}
                        </button>
                        <button className="btn-secondary btn-large" onClick={() => setPage("palmares")}>
                            {isFR ? "Sélection" : "Selection"}
                        </button>
                    </div>
                </div>
            </section>

            {/* ================= CARROUSEL SECTION ================= */}
            <section className="films-section">
                <div className="section-header">
                    <h2>{isFR ? "Sélection Officielle" : "Official Selection"}</h2>
                    <p>{isFR ? "Découvrez l'avenir du cinéma par l'IA" : "Discover the future of cinema through AI"}</p>
                </div>

                <Swiper
                    modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                    effect={'coverflow'}
                    grabCursor={true}
                    centeredSlides={true}
                    slidesPerView={'auto'}
                    loop={true}
                    coverflowEffect={{
                        rotate: 20, stretch: 0, depth: 200, modifier: 1, slideShadows: true,
                    }}
                    autoplay={{ delay: 3000 }}
                    pagination={{ clickable: true }}
                    navigation={true}
                    className="films-swiper"
                >
                    {filmsData.map((film) => (
                        <SwiperSlide key={film.id} style={{ width: '300px' }}>
                            <div className="film-card-visual">
                                <div className="film-poster-img" style={{ backgroundImage: `url(${film.poster})` }} />
                                <div className="film-card-info">
                                    <h3>{film.title}</h3>
                                    <p>{film.director} • {film.country}</p>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </section>

            {/* ================= CTA REGISTRATION ================= */}
            <section className="cta-section">
                <div className="cta-glass-card">
                    <div className="cta-content">
                        <span className="cta-tag">{isFR ? "INSCRIPTIONS OUVERTES" : "REGISTRATIONS OPEN"}</span>
                        <h2>{isFR ? "Rejoignez la" : "Join the"} <span className="text-gradient">{isFR ? "Révolution" : "Revolution"}</span></h2>
                        <p>{isFR ? "Déposez votre projet avant le 31 Mars et tentez de gagner 15k€ de prix." : "Submit your project before March 31st and try to win €15k in prizes."}</p>
                        <button className="btn-neon-large" onClick={() => setPage("register")}>
                            {isFR ? "S'inscrire gratuitement" : "Register for free"}
                        </button>
                    </div>
                    <div className="cta-visual-blobs">
                        <div className="blob blob-cyan"></div>
                        <div className="blob blob-pink"></div>
                    </div>
                </div>
            </section>

            {/* ================= FOOTER & NEWSLETTER ================= */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="newsletter-box">
                        <div className="newsletter-text">
                            <h3>{isFR ? "Newsletter" : "Newsletter"}</h3>
                            <p>{isFR ? "Recevez les actualités du festival en temps réel." : "Get festival news in real time."}</p>
                        </div>
                        <div className="newsletter-input-group">
                            <input
                                type="email"
                                placeholder={isFR ? "Votre email..." : "Your email..."}
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                            />
                            <button className="btn-send-neon" onClick={handleNewsletterSubmit}>
                                {isFR ? "S'abonner" : "Subscribe"}
                            </button>
                        </div>
                    </div>

                    <div className="footer-partners-section">
                        <h3>{isFR ? "Partenaires Officiels" : "Official Partners"}</h3>
                        <div className="partners-grid">
                            {partners.map((p, idx) => (
                                <img key={idx} src={p.logo} alt={p.name} className="partner-logo" />
                            ))}
                        </div>
                    </div>
                    <p className="footer-copy">&copy; 2026 MARSIA Festival. {isFR ? "Tous droits réservés." : "All rights reserved."}</p>
                </div>
            </footer>
        </div>
    );
}

export default HomePage;