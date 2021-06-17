const svgDown =`<svg class='filterSelect-select-svg' width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6 9L0.803847 2.51244e-08L11.1962 -8.834e-07L6 9Z" fill="#C4C4C4"/>
</svg>
`

const svgBack =`<svg class='d3-bubble-chart-selector-title-svg' width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M22.6319 3.62132L20.5106 1.5L10 12.0106L10.0768 12.0873L10.0732 12.0909L20.5838 22.6015L22.7051 20.4802L14.2391 12.0141L22.6319 3.62132Z" fill="#6269FF"/>
</svg>
`



class Data{
	constructor({rawdata}){
		this._rawdata= rawdata;
		this._filtered_data = this._rawdata;
		this._data = this.roll_up(this._rawdata, d => d.brand, d => d.device_cummulative_cnts );
	}
	
	make_hierarchy_data(){
		d3.hierarchy({children: this.data}).sum(d => d.value);
	}
	
	get hierarchy_data(){
		return this.make_hierarchy_data();
	}
	
	filter(filter){
		this._data = this._rawdata.filter(filter);
		this._filtered_data =this._data;
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
		this._data =  this.roll_up(this.data, d=>d[grouping], d=>d.device_cummulative_cnts)
	}
	
	get devicetypeValue(){
		let value =0;
		
		 this._filtered_data.forEach(d=>{
			value += d.idtype_count;
		 });
		 
		return value; 
	}
	
	get distinctBrands(){
		const distinct ={}
		 const distinctArray =[]
		 this._filtered_data.forEach(d=>{
			 if(!distinct[d['brand']]){
				 distinct[d['brand']] =true;
				 distinctArray.push(d['brand']);
			 }
		   }
	    )
		   return distinctArray.length;
	}
	
	get length(){
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
		 const distinctArray =[];
		 this._rawdata.forEach(d=>{
			 if(!distinct[d[key]]){
				 distinct[d[key]] =true;
				 distinctArray.push(d[key]);
			 }
		   }
		 )
		 
		return ['All'].concat(distinctArray.sort()); 
	 }
	
	get data(){
		return this._data;
	}
	
}


class Bubble{
	constructor({data, el}){
		this._data =data;
		this._el = el;
		this.margin ={l:20,t:20,r:20,b:20};
		this.width = this._el.getBoundingClientRect().width;
		this.height = this._el.getBoundingClientRect().height;
		this.pack = this._makePack() ;
		this._root =this.pack(this._data.data)
		this._level = 'brand';
	}
	
	set extraButton(button){
		this._extraButton = button;
	}
	
	_makeSVG(){
		this.svg = d3.select(this._el).append('svg')
		                                         .attr("viewBox", [0, 0, this.width, this.height])
												 .attr("font-size", 10)
												 .attr("text-anchor", "middle");
		
	}
	
	_makeGradient(){
		const lg =this.svg.append('defs')
		        .append('linearGradient')
				.attr('id', 'circleGradient')
				.attr('gradientTransform', 'rotate(90)')
				
	    lg.append('stop')
		         .attr('offset','0%')
				 .attr('stop-color','#DB6EA3')
		
		lg.append('stop')
		 .attr('offset','100%')
		 .attr('stop-color','#8884FF')
				
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
			 self._data.filter(e => e.brand === brand);
			 self._data.setData(self._level);
			 self.rerender(self._data);
			 self._extraButton.setOnClick()
			 self._back.render();
			}	
		}
		
		d3.selectAll('.circle-element').on('click', function(event, d) {
			onClick(event,d);
		  });
		
	}
	
	set level(level){
		this._level = level;
	}
	
	_getRandomRingCoords = radius => {
		const angle = Math.random() * Math.PI * 2;
		const x = Math.cos(angle) * radius + window.innerWidth / 2;
		const y = Math.sin(angle) * radius + window.innerHeight / 2;
		return [x, y];
	  };
	  
	  
	_bubbleExit(exit){
		return exit.remove();
	}
	
	_bubbleEnter(enter){
		enter.append('circle').attr('class', 'circle-element')
		                       .attr("id", (d,i) => (d.leafUid =i))
							   .attr("fill", "url('#circleGradient')")
							   .attr("fill-opacity", 1)
		                       .attr("r", d => 0)
							   .attr('class', 'circle-element')
							   .call(enter=> enter.transition(this._t).attr('r', d=>d.r));
	}
	
	_bubbleUpdate(update){
		return update.attr("id", (d,i) => (d.leafUid =i))
		               .call(update=>update.transition(this._t).attr('r',d=>d.r));
	}
	
	_textUpdate(update){
		return update.attr('font-size','0px').call(update=>update.transition(this._t).attr('font-size',d =>d.r>40?'24px':'12px')
																					  .text(d =>d.r>20? d.text: ""));
	}
	_textEnterTitle(enter){
		return enter.append('tspan').attr('font-size', '0px')
		                      .attr("x", 0)
							  .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.4}em`)
							  .call(enter => enter.transition(this._t)
							                       .attr('font-size', d =>d.r>40?'24px':'12px')
												   .text(d =>d.r>20? d.text: "")
						              )
	}
	_textEnterPerc(enter){
		return enter.append('tspan').attr('font-size', '0px')
							  .attr("x", 0)
							  .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 1.6}em`)
							  .call(enter => enter.transition(this._t)
												   .attr('font-size', d =>d.r>40?'24px':'12px')
												   .text(d =>d.r>20? d.text: "")
									  )
	}
	
	_textExit(exit){
		return exit.remove();
	}
	
	
	_transition(){
		return d3.transition().duration(750);
	}
	
	_makeBubbles(){
		const total = this._data.total();
		this.leaf = this.svg.selectAll("g")
		               .data(this._root.leaves())
		               .join("g")
		               .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`);
		this._t = this._transition();
	   this.leaf.selectAll("circle").data(d=>d).join(enter => this._bubbleEnter(enter),
	                                                 update => this._bubbleUpdate(update),
													 exit  => this._bubbleExit(exit) 
           )
		  
		  this.leaf.selectAll(".circle-text-name").data(d=>d).join("text")
		    .attr('class', 'circle-text-text circle-text-name')
			.style('pointer-events', 'none')
		    .attr('fill','rgb(250,250,250)')
			.attr("clip-path", d => d.clipUid)
		    .selectAll("tspan")
		    .data(d => [{text:d.data.name, r:d.r}] )
		    .join(enter => this._textEnterTitle(enter),
			 update => this._textUpdate(update),
			 exit => this._textExit(exit))
		   
		   this.leaf.selectAll(".circle-text-text-perc").data(d=>d).join("text")
		   .attr('class', 'circle-text-text circle-text-text-perc')
		   .style('pointer-events', 'none')
		   .attr('fill','rgb(250,250,250)')
		   .attr("clip-path", d => d.clipUid)
		   .selectAll("tspan")
		   .data(d => [{text:d3.format('.2%')(d.data.value/total), r:d.r}])
		   .join(enter => this._textEnterPerc(enter),
	             update => this._textUpdate(update),
			     exit => this._textExit(exit))
		   
	}
	
	_setOnHover(){
		function mouseover(){
			// d3.selectAll('.circle-element').transition(1000)
			//           .attr("fill-opacity", 0.2)
					  
		    d3.selectAll('.circle-text-text').transition(1000)
			  .attr("opacity", 0.2);
			  
		    d3.select(this).transition(1000)
			   .attr("fill-opacity", 1)
			d3.select(this.parentNode).selectAll('.circle-text-text').transition(1000)
			                .attr("opacity", 1)
							
							
		    d3.selectAll('.circle-text-text').style('display', 'none');
			
			d3.select(this.parentNode).selectAll('.circle-text-text').style('display', 'block');
			d3.select(this.parentNode).selectAll('.circle-text-text').attr('clip-path', 'null');
			d3.select(this.parentNode).selectAll('.circle-text-text').selectAll('tspan').transition(1000).attr('font-size','28px').text(d =>d.r>5? d.text: "");
		 }
		function mouseout(){
			d3.selectAll('.circle-element').transition(1000)
			  .attr("fill-opacity", 1)
			  
			d3.selectAll('.circle-text-text').transition(1000)
			  .attr("opacity", 1);
			  
			  d3.selectAll('.circle-text-text').style('display', 'block');
			  d3.select(this.parentNode).selectAll('.circle-text-text').attr('clip-path', d => d.clipUid);
			  d3.select(this.parentNode).selectAll('.circle-text-text').selectAll('tspan').transition(1000).attr('font-size',d =>d.r>40?'24px':'12px').text(d =>d.r>20? d.text: "");
			}
			
		    d3.selectAll('.circle-element').on('mouseover', mouseover);
		    d3.selectAll('.circle-element').on('mouseout',mouseout);
	    
	}
	
	set back(back){
		this._back = back;
	}
	
	render(){
	 if(!this.svg){
	  this._makeSVG();
	  this._makeGradient(); 
       }
	  
	  this._makePack()
	  this._makeBubbles();
	  this._setOnClick();
	  this._setOnHover();
	}
	
	rerender(data){
		this._data =data;
		console.log('========>', this._data);
		this.pack = this._makePack(); 
		this._root =this.pack(this._data.data);
		this.render()
	}
}


















class Selector{
	constructor({back,data, el, menu, dataCategory, chart, selectionMenu}){
		this._data = data;
		this._el = el;
		this._dataCategory = dataCategory;
		this._chart = chart;
		this._menu = menu
		this._divElData =[{class:'filterLabel'}, {class:'filterSelect'}]
		this._back = back;
		this.selection ='All'
		this._selectionMenu = selectionMenu;
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
	
	makeSelectionButton(){
		const self = this;
		d3.select('.filterSelect-select-button').remove();
		const text = this.selection === 'All'? 'Select category':this.selection;
		this._filter_selection = d3.select('.filterSelect').append('div')
		                                            .attr('class', 'filterSelect-select-button')
													.attr('value', this.selection)
													.html(`<div class='filterSelect-select-div' >${svgDown} <span>${text} </span> </div>`);
													
	    d3.select('.filterSelect-select-button').on('click', function(){
			if(self._selectionMenu.rendered){
				self._destroySelectionMenu();
			}else{
				self._renderSelectionMenu();
			}
		})
													
		                                            
	}
	//this._data.distinct('category')
	
	_renderSelectionMenu(){
		this._selectionMenu.render()
		this._onChange();
	}
	_destroySelectionMenu(){
		this._selectionMenu.destroy();
	}
	
	_onChange(){
		const self = this;
	    const selection = d3.selectAll('.selection-menu-custom-divs')
	                        .on('click', function(event,d){
								const value = event.target.__data__;
								if(value ==='All'){
									self.selection = value;
									self._data.filter(d=> true);
									self._data.setData('brand');
									self._chart.rerender(self._data);
									self._selectionMenu.destroy();
									self._menu.rerender();
									self._back.unrender();
									self.makeSelectionButton();
									return;
								}
								self._data.filter(d=> d[self._dataCategory] === value );
								self.selection = value;
								self._data.setData('brand');
								self._selectionMenu.destroy();
								self._chart.rerender(self._data);
								self._menu.rerender();
								self._back.render();
								self.makeSelectionButton();
							})
		
	}
	
	allRender(){
		this._data.filter(d=> true);
		this._data.setData('brand');
		this._chart.rerender(data);
		this._chart.level = 'brand';
		this._menu.rerender();
		this._back.unrender();
		this.rerender();
	}
	
	render(){
		this.makeMainDiv();
		this.makeInnerDiv();
		this.makeSelectionButton();
	}
	
	rerender(){
		this.mainDiv.remove();
		this.render();
	}
	
}





class SelectionMenu{
	constructor({data,el}){
		this._data = data;
		this._el = el;
		this.rendered = false;
	}
    _makeMenu(){
		this._main_el = d3.select(this._el)
		                   .append('div')
						   .attr('class', 'selection-menu-custom');
	}
	
	_makeSelections(){
		 this._main_el.selectAll('.selection-menu-custom-divs')
		.data(this._data.distinct('category'))
		.join('div')
		.attr('class', 'selection-menu-custom-divs')
		.attr('value', d =>d)
		.text(d=>d);
	}

	render(){
		d3.select(this._el).style('display','block')
		this.rendered = true;
		this._makeMenu();
		this._makeSelections();
	}
	destroy(){
		d3.select(this._el).style('display','none')
		this.rendered = false;
		this._main_el.remove();
	}
}



class Menu{
	constructor({data, el}){
		this._data = data;
		this._el = el;
		this._menuData = this._makeMenuData();
	}
		 _makeMenuData(){
			return [{title:'Brands', value:d3.format(",")(this._data.distinctBrands)},
			        {title:'Device Types', value:d3.format(",")(this._data.devicetypeValue)}]
		}
    _makeHeadlineStat(){
		this._mainDiv = d3.select(this._el).append('div')
		                                   .attr('class', 'chart-menu-inner-wrapper')
		                    
			  this._mainDiv.selectAll('div')
		                    .data(this._makeMenuData())
							.join('div')
							.attr('class', d => `menu-stat-wrapper ${d.title}-menu-stat`)
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
	
	rerender(){
		if(this._mainDiv){
			  this._mainDiv.remove();
			  }
		this._menuData = this._makeMenuData();
		this.render();	
	}
}


class Back{
	constructor({chart,el, menu}){
		this._el = el;
		this._selector = null;
		
	}
	_onClick(){
		const self = this;
		d3.select('.d3-bubble-chart-selector-title').on('click',function(){
			self.unrender()
			self._selector.allRender();
		})
	}
	
	_offClick(){
		this._selector.selection = 'All';
		this._selector.makeSelectionButton();
	}
	
	set selector(selector){
		this._selector = selector;
	}
	
	
	render(){
		d3.select(this._el).attr('class', 'd3-bubble-chart-selector-title title-active')
		              .html(`<div>${svgBack} <span>${"Back to all devices"} </span> </div>`);
		this._onClick();
	}
	unrender(){
		d3.select(this._el).attr('class', 'd3-bubble-chart-selector-title')
		  .text('Take a closer look');
        this._offClick();
	}
}

class ChartFull{
	constructor({el,chart, data}){
		this._el = el;
		this._chart = chart;
		this._data = data;
	}
	
	setOnClick(){
		const self = this;
		function onClick(){
			self._data.filter(d=>true);
			self._data.setData('brand');
			self._chart.rerender(self._data);
			self._chart.setLevel(0);
			d3.select(this).remove();
		}
		
	   const button = d3.select(this._el).append('button')
	                                      .text('Reset Chart')
		button.on('click', onClick);
	}
}
 



function main(raw_data){
	
	const data = new Data({
		rawdata:raw_data
	})
	

	const levels = ['brand', 'category']
	
	const bubble = new Bubble({
		data:data,
		el:document.querySelector('.d3-bubble-chart-right')
	})
	
	const chart_back_button = new ChartFull({
		el:document.querySelector('.d3-bubble-chart-right'),
		data:data,
		chart:bubble,
	})
	
	bubble.extraButton = chart_back_button;
	
	bubble.render();
	
	const menu = new Menu({
		data:data,
		el:document.querySelector('.d3-bubble-chart-menu-menu'),
	})
	
	const back = new Back({
		el:document.querySelector('.d3-bubble-chart-selector-title'),
		menu:menu,
	})
	const selectionMenu = new SelectionMenu({
		data:data,
		el:document.querySelector('.d3-bubble-chart-selector-menu')
	})
	const selector = new Selector({
		data:data,
		el:document.querySelector('.d3-bubble-chart-selector-selector'),
		chart:bubble,
		menu:menu,
		back:back,
		selectionMenu:selectionMenu,
		dataCategory:'category',
		
	})
	
	back.selector = selector;
	bubble.back = back;
	selector.render();
	menu.render();
}



d3.csv('/data/1B.csv', d=>{
	return {
		ts:d.ts,
		brand:d.brand,
		category:d.category,
		device_cummulative_cnts:parseInt(d.device_cummulative_cnts),
		idtype_count:parseInt(d.idtype_count),
	}
}).then(data=>{
	main(data);
});

