import React, { useEffect, useState } from 'react';
// 1. Imports Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';

// 2. Styles Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const API_URL = 'http://localhost:8081/api';

function PalmaresPage({ t }) {
    const [winners, setWinners] = useState([]);
    const [loading, setLoading] = useState(true);

    const isFR = t.nav_home === "Accueil";

    const translatePrize = (prix) => {
        if (!prix) return "";
        if (isFR) return prix;
        const prizeMap = {
            "Grand Prix du Jury": "Jury Grand Prize",
            "Prix de l'Innovation": "Innovation Award",
            "Meilleure Direction Artistique": "Best Artistic Direction",
            "Prix du Public": "Audience Award",
            "Mention Spéciale": "Special Mention"
        };
        return prizeMap[prix] || prix;
    };

    useEffect(() => {
        const fetchPalmares = async () => {
            try {
                const res = await fetch(`${API_URL}/palmares`);
                const data = await res.json();
                setWinners(data);
            } catch (err) {
                console.error("Erreur de récupération:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPalmares();
    }, []);

    const getIcon = (prix) => {
        const p = prix?.toLowerCase() || "";
        if (p.includes("grand prix")) return "🏆";
        if (p.includes("artistique") || p.includes("artistic")) return "🎨";
        if (p.includes("innovation")) return "🚀";
        return "⭐";
    };

    if (loading) return (
        <div className="cyber-loader">
            <div className="loader-ring"></div>
            <span>{isFR ? "SYNCHRONISATION..." : "SYNCING SYSTEM..."}</span>
        </div>
    );

    return (
        <div className="palmares-section">
            <div className="cyber-container">
                <header className="palmares-header">
                    <span className="section-tag">
                        {isFR ? "ÉDITION 2026" : "2026 EDITION"}
                    </span>
                    <h1 className="main-title">
                        {isFR ? "LE PALMARÈS" : "THE WINNERS"}
                    </h1>
                    <div className="gradient-bar-winners"></div>
                </header>

                {winners.length > 0 ? (
                    <Swiper
                        modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                        effect={'coverflow'}
                        grabCursor={true}
                        centeredSlides={true}
                        slidesPerView={'auto'}
                        loop={true}
                        coverflowEffect={{
                            rotate: 15,
                            stretch: 0,
                            depth: 300,
                            modifier: 1,
                            slideShadows: true,
                        }}
                        autoplay={{ delay: 4000, disableOnInteraction: false }}
                        pagination={{ clickable: true }}
                        navigation={true}
                        className="winners-swiper"
                    >
                        {winners.map((film) => (
                            <SwiperSlide key={film.id_film} className="winner-slide">
                                <div className="winner-card-neon">
                                    <div className="price-badge-neon">
                                        <span className="icon">{getIcon(film.prix_remporte)}</span>
                                        <span className="prize-text">{translatePrize(film.prix_remporte)}</span>
                                    </div>

                                    <div className="poster-wrapper">
                                        <img
                                            src={film.affiche_url ? `http://localhost:8081${film.affiche_url}` : `https://via.placeholder.com/400x600/0d0d0d/ff2d95?text=${film.titre}`}
                                            alt={film.titre}
                                        />
                                        <div className="hover-mask">
                                            <button className="btn-neon-watch">
                                                {isFR ? "VOIR LE FILM" : "WATCH FILM"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="film-details-cyber">
                                        <h3>{film.titre}</h3>
                                        <p className="meta-neon">{film.realisateur} • {film.pays}</p>
                                        <p className="desc-cyber">
                                            {film.description || (isFR
                                                ? "Chef-d'œuvre récompensé par le jury MarsIA."
                                                : "Masterpiece awarded by the MarsIA jury.")
                                            }
                                        </p>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <div className="no-data-neon">
                        <h3>{isFR ? "EN ATTENTE DES RÉSULTATS" : "AWAITING RESULTS"}</h3>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PalmaresPage;