class Vector {
    constructor(vector) {
      this.vector = vector;
    }
  
    add(vector) {
      return new Vector(Matter.Vector.add(this.vector, vector));
    }
  
    sub(vector) {
        return new Vector(Matter.Vector.sub(this.vector, vector));
    }
  
    rotate(angle) {
        return new Vector(Matter.Vector.rotate(this.vector, angle));
    }

    mult(scalar) {
        return new Vector(Matter.Vector.mult(this.vector, scalar));
    }

    magnitude(){
        return Matter.Vector.magnitude(this.vector);
    } 
  
    get() {
      return this.vector;
    }
  }

  function chain(vector) {
    return new Vector(vector);
  }

  function toRadians(degrees){
    return degrees * (Math.PI / 180);
  }
