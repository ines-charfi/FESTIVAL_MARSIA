import React, { useState } from "react";


function HomePage({ setPage }) {
    const [newsletterEmail, setNewsletterEmail] = useState("");

    const filmsData = [
        { id: 1, title: "Film 1", director: "Réalisateur 1", country: "France", poster: "/posters/film1.jpg" },
        { id: 2, title: "Film 2", director: "Réalisateur 2", country: "France", poster: "/posters/film2.jpg" },
        { id: 3, title: "Film 3", director: "Réalisateur 3", country: "France", poster: "/posters/film3.jpg" },
        { id: 4, title: "Film 4", director: "Réalisateur 4", country: "France", poster: "/posters/film4.jpg" },
        { id: 5, title: "Film 5", director: "Réalisateur 5", country: "France", poster: "/posters/film5.jpg" },
        { id: 6, title: "Film 6", director: "Réalisateur 6", country: "France", poster: "/posters/film6.jpg" }
    ];

    const partners = [
        { name: "Partner 1", logo: "/partners/partner1.png" },
        { name: "Partner 2", logo: "/partners/partner2.png" },
        { name: "Partner 3", logo: "/partners/partner3.png" },
        { name: "Partner 4", logo: "/partners/partner4.png" },
    ];

    const handleNewsletterSubmit = async () => {
        if (!newsletterEmail) return alert("Veuillez entrer un email");

        try {
            const response = await fetch("http://localhost:8081/api/v1/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newsletterEmail }),
            });

            if (response.ok) {
                alert("Inscription réussie !");
                setNewsletterEmail("");
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Erreur lors de l'inscription");
            }
        } catch (error) {
            console.error("Erreur:", error);
            alert("Le serveur ne répond pas.");
        }
    };

    return (
        <div className="homepage">

            {/* ================= HERO ================= */}
            <section className="hero">
                <video autoPlay muted loop className="hero-video">
                    <source src="./assets/istockphoto-1221182654-640_adpp_is.mp4" type="video/mp4" />
                </video>
                <div className="hero-overlay" />

                <div className="hero-content">
                    <h1 className="hero-title">MARSIA 2026</h1>
                    <p className="hero-subtitle">
                        Festival International <br /> Court-métrage IA
                    </p>

                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-number">127</span>
                            <span>Films</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">24</span>
                            <span>Pays</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">15k€</span>
                            <span>Prix</span>
                        </div>
                    </div>

                    <div className="hero-buttons">
                        <button className="btn-primary btn-large" onClick={() => setPage("soumission-film")}>
                            Participer
                        </button>
                        <button className="btn-secondary btn-large" onClick={() => setPage("palmares")}>
                            Sélection
                        </button>
                    </div>
                </div>
            </section>

            {/* ================= FILMS ================= */}
            <section className="films-section">
                <h2>Sélection Officielle</h2>
                <p>Les courts-métrages en compétition</p>

                <div className="films-grid">
                    {filmsData.map((film) => (
                        <div key={film.id} className="film-card" onClick={() => setPage("films")}>
                            <div className="film-poster" style={{ backgroundImage: `url(${film.poster})` }} />
                            <div className="film-info">
                                <h3>{film.title}</h3>
                                <p>{film.director} • {film.country}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ================= CTA ================= */}
            <section className="cta-section">
                <h2>Participez à MARSIA 2026</h2>
                <p>Déposez votre court-métrage IA avant le 31 mars</p>

                <button className="btn-primary btn-large" onClick={() => setPage("register")}>
                    S'inscrire gratuitement
                </button>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="footer">
                <div className="footer-partners">
                    <h3>Partenaires du festival</h3>
                    <div className="partners-grid">
                        {partners.map((p, idx) => (
                            <img key={idx} src={p.logo} alt={p.name} className="partner-logo" />
                        ))}
                    </div>
                </div>

                <div className="footer-newsletter">
                    <h3>Newsletter</h3>
                    <p>Recevez toutes les actualités du festival</p>
                    <div className="newsletter-form">
                        <input
                            type="email"
                            placeholder="Votre email"
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                        />
                        <button onClick={handleNewsletterSubmit}>S'inscrire</button>
                    </div>
                </div>

                <p className="footer-copy">&copy; 2026 MARSIA Festival. Tous droits réservés.</p>
            </footer>
        </div>
    );
}

export default HomePage;
