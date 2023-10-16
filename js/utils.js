async function loadData(filename) {
    try {
      const response = await fetch(filename);
      const data = await response.json();
        return data;
    } catch (error) {
      console.error('Error:', error);
    }
  }


function unionBounds(...bounds){
  return Matter.Bounds.create([...bounds.map(b=>b.min), ...bounds.map(b=>b.max)]);
}