class Data{
	constructor({rawdata}){
		this._rawdata= rawdata;
		this._data = this.roll_up(this._rawdata, d => d.brand, d => d.device_cummulative_cnts );
		
		
		console.log(this.data);
	}
	
	make_hierarchy_data(){
		d3.hierarchy({children: this.data}).sum(d => d.value);
	}
	
	get hierarchy_data(){
		return this.make_hierarchy_data();
	}
	
	filter(filter){
		this.data = this._rawdata.filter(filter);
	}
	//@data raw data current data
	//grouping is a function
	roll_up(data, grouping, sum){
		const new_data =[];
		d3.rollup(data, v => d3.sum(v, sum),grouping).forEach((value, key)=>{
			new_data.push({name:key, value:value});
		});
		return new_data;
	}
	
	total(){
		let total = 0;
		this._data.forEach(d=>{
			total += d.value;
		})
		return total;
	}
	
	get data(){
		return this._data;
	}
	
}

const data = new Data({
	rawdata:data_raw.map(d=>{
		d.device_cummulative_cnts = parseInt(d.device_cummulative_cnts);
		return d;
	}),
})









class Bubble{
	constructor({data, el}){
		this._data =data;
		console.log('=====>', this._data);
		
		this.el = el;
		this.margin ={l:20,t:20,r:20,b:20};
		this.width = this.el.getBoundingClientRect().width;
		this.height = this.el.getBoundingClientRect().height;
		this.pack = this._makePack() ;
		this._root =this.pack(this._data.data)
		
		console.log('======>',this._root);
	}
	
	_makeSVG(){
		this.svg = d3.select('.d3-bubble-chart').append('svg')
		                                         .attr("viewBox", [0, 0, this.width, this.height])
												 .attr("font-size", 10)
												 .attr("text-anchor", "middle");
		
	}
	
	_makePack(){
        return (data) => d3.pack()
		.size([this.width - 2, this.height - 2])
		.padding(1)
	    (d3.hierarchy({children: this._data.data})
		.sum(d => d.value));
	}
	
	
	
	_makeBubbles(){
		const total = this._data.total();
		console.log('========>', this._root.leaves());
		console.log('=======> total', total);
		this.leaf = this.svg.selectAll("g")
		               .data(this._root.leaves())
		               .join("g")
		               .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`);
		
	   this.leaf.append("circle")
		  .attr("id", (d,i) => (d.leafUid =i))
		  .attr("r", d => d.r)
		  .attr("fill-opacity", 0.7)
		  .attr("fill", d => 'red');
		  
		  this.leaf.append("text")
		    .attr('fill','rgb(250,250,250)')
			.attr('font-size', '12px')
			.attr("clip-path", d => d.clipUid)
		    .selectAll("tspan")
		    .data(d => [{text:d.data.name, r:d.r}, {text:d3.format('.2%')(d.data.value/total), r:d.r}])
		    .join("tspan")
			.attr("x", 0)
			.attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
			.text(d =>d.r>20? d.text: "");
	}
	
	
	
	render(){
	 if(this.svg){
	  this.svg.remove();
      }
	  this._makeSVG();
	  this._makePack()
	  this._makeBubbles();
	}
	
	rerender(data){
		this._root = d3.pack(data);
		this.render()
	}
}
 

const bubble = new Bubble({
	data:data,
	el:document.querySelector('.d3-bubble-chart')
})

bubble.render();

console.log('we got here ====>')
