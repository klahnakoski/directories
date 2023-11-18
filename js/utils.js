async function loadData(filename) {
    try {
        const response = await fetch(filename);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
    }
}

function minMax(...values){
    let min = Infinity;
    let max = -Infinity;
    values.forEach(value=>{
        min = Math.min(min, value);
        max = Math.max(max, value);
    });
    return {min, max};
}