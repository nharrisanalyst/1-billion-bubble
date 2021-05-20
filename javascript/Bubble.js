class Data{
	constructor({rawdata}){
		this._rawdata= rawdata;
	     console.log(this._rawdata);
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
		this._data = this._rawdata.filter(filter);
		console.log('========>', filter);
		console.log('=======> data',this._data);
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
	
	 setData(grouping){
		 console.log('=======> this is working', this.roll_up(this.data, d=>d[grouping], d=>d.device_cummulative_cnts));
		this._data =  this.roll_up(this.data, d=>d[grouping], d=>d.device_cummulative_cnts)
	}
	
	get devicetypeLength(){
		const distinct ={}
		 const distinctArray =[]
		 this._rawdata.forEach(d=>{
			 if(!distinct[d['idtype']]){
				 distinct[d['idtype']] =true;
				 distinctArray.push(d['idtype']);
			 }
		   }
		 )
		 
		return distinctArray.length; 
	}
	
	get distinctBrands(){
		const distinct ={}
		 const distinctArray =[]
		 this._rawdata.forEach(d=>{
			 if(!distinct[d['brand']]){
				 distinct[d['brand']] =true;
				 distinctArray.push(d['brand']);
			 }
		   }
	    )
		   return distinctArray.length;
	}
	
	get length(){
		console.log('=====> length',this._rawdata.length)
		return this._rawdata.length;
	}
	
	total(){
		let total = 0;
		this._data.forEach(d=>{
			total += d.value;
		})
		return total;
	}
	 distinct(key){
		 const distinct ={}
		 const distinctArray =['All']
		 this._rawdata.forEach(d=>{
			 if(!distinct[d[key]]){
				 distinct[d[key]] =true;
				 distinctArray.push(d[key]);
			 }
		   }
		 )
		 
		return distinctArray; 
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



const levels = ['brand', 'category']



















class Bubble{
	constructor({data, el}){
		this._data =data;
		console.log('=====>', this._data);
		
		this._el = el;
		this.margin ={l:20,t:20,r:20,b:20};
		this.width = this._el.getBoundingClientRect().width;
		this.height = this._el.getBoundingClientRect().height;
		this.pack = this._makePack() ;
		this._root =this.pack(this._data.data)
		this._level = 'brand';
		
		console.log('======>',this._root);
	}
	
	_makeSVG(){
		this.svg = d3.select(this._el).append('svg')
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
	
	setLevel(index){
		this._level = levels[index];
	}
	
	_setOnClick(){
		const self = this;
		function onClick(event,d){
			if(self._level === 'brand'){
		     const brand = d.data.name;
		     self.setLevel(1);
			 console.log('====>', data);
			 self._data.filter(e => e.brand === brand);
			 self._data.setData(self._level);
			 self.rerender(self._data);
			}	
		}
		
		d3.selectAll('.circle-element').on('click', function(event, d) {
			onClick(event,d);
		  });
		
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
	      .attr('class', 'circle-element')
		  .attr("id", (d,i) => (d.leafUid =i))
		  .attr("r", d => d.r)
		  .attr("fill-opacity", 0.7)
		  .attr("fill", d => 'rgb(255, 59, 59)');
		  
		  this.leaf.append("text")
		    .attr('class', 'circle-text')
			.style('pointer-events', 'none')
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
	
	_setOnHover(){
		function mouseover(){
			d3.selectAll('.circle-element')
			          .attr("fill-opacity", 0.2)
		    d3.select(this)
			   .attr("fill-opacity", 0.8)
		 }
		function mouseout(){
			d3.selectAll('.circle-element')
			  .attr("fill-opacity", 0.7)
		}
		d3.selectAll('.circle-element').on('mouseover', mouseover);
		d3.selectAll('.circle-element').on('mouseout',mouseout);
	}
	
	render(){
		console.log('========>    we are rendering the svg')
	 if(this.svg){
	  this.svg.remove();
      }
	  this._makeSVG();
	  this._makePack()
	  this._makeBubbles();
	  this._setOnClick();
	  this._setOnHover();
	}
	
	rerender(data){
		this._data =data;
		console.log('=======> crying', this._data.data);
		this.pack = this._makePack();
		console.log('=======> crying', this._data.data); 
		this._root =this.pack(this._data.data);
		this.render()
	}
}


















class Selector{
	constructor({data, el, title, chart}){
		console.log("=======> selector is here");
		this._data = data;
		this._el = el;
		this._title = title;
		this._chart = chart;
		this._divElData =[{class:'filterLabel'}, {class:'filterSelect'}]
	}
	
	makeMainDiv(){
		this.mainDiv = d3.select(this._el).append('div')
		                            .attr('class', 'filterLabel-wrapper');
	}
	
	makeInnerDiv(){
		this._mainSelection = this.mainDiv.selectAll('div').data(this._divElData)
		                                                   .join('div')
					                                        .attr('class', d=> d.class);
	}
	
	_makeSelection(){
		this._filter_selection = d3.select('.filterSelect').append('select')
		                                            .attr('class', 'filterSelect-select')
		                                            .selectAll('options')
													.data(this._data.distinct('category'))
													.join('option')
													.attr('value', d =>d)
													.text(d=>d);
		                                            
	}
	
	_makeTitle(){
		console.log('===========> this is working');
		this._title_selection = d3.select('.filterLabel')
		console.log('=======> title selection', this._title_selection);
		this._title_selection.append('div')
		                      .attr('class','filterLabel-title')
							  .text(this._title)
	}
	
	_onChange(){
		const self = this;
	   const selection = d3.select('.filterSelect-select')
	                        .on('change', function(event,d){
								const value = event.target.value;
								if(event.target.value ==='All'){
									self._data.filter(d=> true);
									self._data.setData('brand');
									self._chart.rerender(data);
									return;
								}
								
								console.log('=====>', event.target.value);
								self._data.filter(d=> d[self._title] === value );
								self._data.setData('brand');
								self._chart.rerender(data);
								console.log('======> event', event);
								console.log('======> d', d);
							})
	}
	
	render(){
		this.makeMainDiv();
		this.makeInnerDiv();
		this._makeTitle();
		this._makeSelection();
		this._onChange();
	}
	
}















class Menu{
	constructor({data, el}){
		this._data = data;
		this._el = el;
		this._menuData = this._makeMenuData();
	}
		 _makeMenuData(){
			return [{title:'Last 30-Day Active Devices', value:this._data.length}, 
			        {title:'% of Devices identified',value:.99}, 
			        {title:'Device Types', value:this._data.devicetypeLength},
				     {title:'Brands', value:this._data.distinctBrands} ]
		}
    _makeHeadlineStat(){
		d3.select(this._el).selectAll('div')
		                   .attr('class', 'chart-menu-inner-wrapper')
		                    .data(this._makeMenuData())
							.join('div')
							.attr('class', 'menu-stat-wrapper')
							.html(d=> this._makeStatHTML(d));
							
	}
	
	_makeStatHTML(d){
		return `<div class='stat-title'>${d.title}</div>
		        <div class='stat-value'>${d.value}</div>
		       `
	}
	
	render(){
		this._makeHeadlineStat();
	}
}
 

const bubble = new Bubble({
	data:data,
	el:document.querySelector('.d3-bubble-chart-right')
})

bubble.render();

// const selector = new Selector({
// 	data:data,
// 	el:document.querySelector('.d3-bubble-chart-left-inner-wrapper'),
// 	title:"category",
// 	chart:bubble,
// })
// 
// selector.render();
// 
// const menu = new Menu({
// 	data:data,
// 	el:document.querySelector('.d3-bubble-chart-right'),
// })
// 
// menu.render();
// console.log('we got here ====> device type length', data.devicetypeLength);
// console.log('we got here ====> device type length', data.length);
