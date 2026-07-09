package com.demo.matching.domain;

/**
 * Declaration order is strength order (strongest first) so that
 * Comparator.comparing(LolTier::ordinal) sorts correctly without extra mapping.
 */
public enum LolTier {
    CHALLENGER,
    GRANDMASTER,
    MASTER,
    DIAMOND,
    EMERALD,
    PLATINUM,
    GOLD,
    SILVER,
    BRONZE,
    IRON;

    public boolean hasDivision() {
        return this != CHALLENGER && this != GRANDMASTER && this != MASTER;
    }
}
