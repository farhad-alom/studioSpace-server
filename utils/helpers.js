export function pickStudioFields(body) {
    return {
        title: String(body.title || '').trim(),
        category: String(body.category || '').trim(),
        hourlyRate: Number(body.hourlyRate) || 0,
        securityDeposit: Number(body.securityDeposit) || 0,
        maxCapacity: Number(body.maxCapacity) || 0,
        location: String(body.location || '').trim(),
        image: String(body.image || '').trim(),
        amenities: Array.isArray(body.amenities) ? body.amenities : [],
        overview: String(body.overview || '').trim(),
    };
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');