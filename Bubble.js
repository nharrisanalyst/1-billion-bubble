class Bubble{
	constructor({data, el}){
		this._data = data;
		this.el = el;
	}
	
	
	
	render(){
	  this.svg.remove();
	}
	
	rerender(data){
		this._data=data;
		this.render()
	}
}

