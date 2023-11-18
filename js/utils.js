async function loadData(filename) {
    try {
        const response = await fetch(filename);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
    }
}
