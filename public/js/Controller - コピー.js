class Controller {
    constructor() {
        //this.searchBtn = document.querySelector(".btn, .btn-outline-success");
        this.form = document.querySelector(".form-row");
        this.nameOne = document.querySelector("#name-one");
        this.nameTwo = document.querySelector("#name-two");
        this.navEl = document.querySelector(".nav-bar");
        this.searchResultEl = document.querySelector("#results");
        this.matchesEl = document.querySelector("#matches");
        this.matchLiLeft=document.querySelector("#matches-left");
        this.matchLiMiddle=document.querySelector("#matches-middle");
        this.matchLiRight=document.querySelector("#matches-right");
        this.VAOneID = "";
        this.VATwoID = "";
        this.VARolesOne=[];
        this.VARolesTwo=[];
        this.overlappingRoles=[];
        this.searchVAResult = [];
        this.conn = 'https://graphql.anilist.co';
        this.tempName = "";
        this.actualPage = 1;
        this.navUl = document.querySelector(".pagination");
        this.addEvents();
        this.addEventLiNav();
        this.addEventLiSearch();
    }

    addEvents() {
        this.form.addEventListener("submit", (e) => {
            if(!this.matchesEl.classList.contains("d-none")){
                this.matchesEl.classList.add("d-none");
            }
            this.searchVAResult = [];
            e.preventDefault();
            this.tempName = this.form.input.value;
            let params={
                name:this.tempName
            }
            
            this.search(true,params);
        });
    }

    search(selecting,params,callback=this.handleData) {
        //
        callback=callback.bind(this);
        
        let options = this.setOptions(selecting,params);
        fetch(this.conn, options).then(this.handleResponse)
            .then(data => callback(data))
            .catch(this.handleError);
    }

    handleData(data) {
        this.getVAList(data);
    }

    getVAList(data) {
        if (data.data.Page.pageInfo.total == 0) {
            //not found
            console.log("none found");
        } else {
            //console.log(data);
            let len = data.data.Page.staff.length;
            for (let i = 0; i < len - 1; i++) {
                if (data.data.Page.staff[i].characters.edges.length > 0) {
                    let va = data.data.Page.staff[i]
                    let obj = {
                        id: va.id,
                        name: va.name
                    }
                    this.searchVAResult.push(obj);
                }
            }

            if (data.data.Page.pageInfo.hasNextPage == true) {
                let page = data.data.Page.pageInfo.currentPage + 1;
                let params={
                    name:this.tempName,
                    page
                }
                this.search(true,params);
            } else {
                //this.VASearchPagination();
                this.showStuffs(this.searchResultEl,this.callbackVASearch);
            }
        }
    }
    //
    /*
    VASearchPagination() {
        this.searchResultEl.innerHTML = "";
        let totalItens = this.searchVAResult.length;
        let perPage = 10;
        this.showPages(totalItens, perPage);
        this.searchResultEl.classList.remove("d-none");
        let start = perPage * (this.actualPage - 1);
        let end = start + perPage;

        for (let i = start; i < end; i++) {
            if(this.searchVAResult.length>i){
            let va = this.searchVAResult[i];
            
            this.searchResultEl.innerHTML += `<a data-id="${va.id}" href="" class="list-group-item list-group-item-action">
            ${this.getVAName(va.name)}
            </a>`

            }
        }

    }*/

    addEventLiSearch(){

        this.searchResultEl.addEventListener("click",(e)=>{
            //O nome do elemento tem q ser em letras maiúsculas
            if(e.target && e.target.nodeName=="A"){
                e.preventDefault();                
                this.selectVA(e.target);
                this.searchResultEl.innerHTML="";
                this.navUl.innerHTML = ""
                
            }
        });

    }

    selectVA(el){

        if(this.nameOne.classList.contains("d-none")){
        this.nameOne.innerHTML=el.textContent;
        this.VAOneID=el.dataset.id
        this.nameOne.classList.remove("d-none");
        }else if(this.nameTwo.classList.contains("d-none")){
            this.nameTwo.innerHTML=el.textContent;
            this.VATwoID=el.dataset.id
            this.nameTwo.classList.remove("d-none");
        }else{
            this.nameOne.innerHTML=el.textContent;
            this.VAOneID=el.dataset.id
            this.nameTwo.innerHTML="";
            this.VATwoID="";
            this.nameTwo.classList.add("d-none");
        }
        if(this.VAOneID!=="" && this.VATwoID!==""){

            this.getDataFromBoth();
        }

    }
   
    getDataFromBoth(){
        this.VARolesOne=[];
        this.VARolesTwo=[];
        let params={
            id1:this.VAOneID,
            id2:this.VATwoID,
            page1:1,
            page2:1
        }
        this.search(false,params,this.handleDataFromBoth);
             
    }

    handleDataFromBoth(data){
        //console.log(data);
        let dataA;
        let dataB;
        let params={}
        let sendagain=false;

        if(data.data.a){
            dataA=data.data.a;
            this.VARolesOne.push(...dataA.characters.edges);

            if(dataA.characters.pageInfo.hasNextPage){
                params.id1=this.VAOneID;
                params.page1=dataA.characters.pageInfo.currentPage+1;
                sendagain=true;
            }
        }
        if(data.data.b){
            dataB=data.data.b;
            this.VARolesTwo.push(...dataB.characters.edges);
            if(dataB.characters.pageInfo.hasNextPage){
                params.id2=this.VATwoID;
                params.page2=dataB.characters.pageInfo.currentPage+1;
                sendagain=true;
            }
        }        
        //arr=array.map(a => ({...a}));      
        sendagain?
        this.search(false,params,this.handleDataFromBoth):
        this.compareWorks();    
    }

    compareWorks(){
        this.overlappingRoles=[];       
        console.time();
        this.VARolesOne.forEach(role1=>{
            this.VARolesTwo.forEach(role2=>{
                if(role1.media[0].title.native==role2.media[0].title.native){
                    
                    let obj={
                        workname:role1.media[0],
                        name1:role1.node.name,
                        name2:role2.node.name
                    };
                    this.overlappingRoles.push(obj);
                }          

            });
        });
        console.log(this.overlappingRoles);
        console.timeEnd();
        if(this.overlappingRoles.length<1){
            console.log("no matches found");
        }
        this.actualPage=1;
        //this.showWorks();
        this.showStuffs(this.matchesEl,this.callbackWorks);

    }
    showStuffs(element,callback){
        element.classList.remove("d-none");
        element.innerHTML="";   
        let totalItens=this.overlappingRoles.length;
        let perPage=10;
        this.showPages(totalItens,perPage);
        let start=perPage*(this.actualPage - 1);
        let end=start+perPage;
        
        callback=callback.bind(this);
        callback(totalItens,start,end);
        
        
    }
    //
    /*
    showWorks(){        
        this.matchesEl.classList.remove("d-none");   
        let totalItens=this.overlappingRoles.length;
        let perPage=10;
        this.showPages(totalItens,perPage);
        let start=perPage*(this.actualPage - 1);
        let end=start+perPage;
        for(let i =start;i<end;i++){
            if(totalItens>i){
                let role=this.overlappingRoles[i];
                let ul=document.createElement("ul");
                ul.innerHTML+=`
                <li id="matches-left" class="list-group-item w">
                ${this.getVAName(role.name1)}
                </li>
                <li id="matches-middle"class="list-group-item w">
                ${this.getWorkname(role.workname)}
                </li>
                <li id="matches-right"class="list-group-item w">
                ${this.getVAName(role.name2)}
                </li>`;            
                ul.classList.add("list-group","list-group-horizontal");
                this.matchesEl.appendChild(ul);

            }
        }         
    }*/
    
    callbackWorks(totalItens,start,end){
        for(let i =start;i<end;i++){
            if(totalItens>i){
                let role=this.overlappingRoles[i];
                let ul=document.createElement("ul");
                ul.innerHTML+=`
                <li id="matches-left" class="list-group-item w">
                ${this.getVAName(role.name1)}
                </li>
                <li id="matches-middle"class="list-group-item w">
                ${this.getWorkname(role.workname)}
                </li>
                <li id="matches-right"class="list-group-item w">
                ${this.getVAName(role.name2)}
                </li>`;            
                ul.classList.add("list-group","list-group-horizontal");
                this.matchesEl.appendChild(ul);

            }
        } 
    }

    callbackVASearch(totalItens,start,end){

        for (let i = start; i < end; i++) {
            if(this.searchVAResult.length>i){
            let va = this.searchVAResult[i];
            
            this.searchResultEl.innerHTML += `<a data-id="${va.id}" href="" class="list-group-item list-group-item-action">
            ${this.getVAName(va.name)}
            </a>`

            }
        }
    }
    getWorkname(worknameObj){
        let title=`${worknameObj.title.romaji!==null?worknameObj.title.romaji:""} 
                      ${worknameObj.title.native!==null?`(`+worknameObj.title.native+`)`:""} 
        `;
        return title;
    }

    getVAName(nameObj){
        return ` ${nameObj.last !== null ? nameObj.last : ""}
        ${nameObj.first !== null ? nameObj.first : ""}
        ${nameObj.native !== null ? `(` + nameObj.native + `)` : ""}`
    }

    getCharName(charnameObj){
        return ` ${nameObj.last !== null ? nameObj.last : ""}
        ${nameObj.first !== null ? nameObj.first : ""}
        ${nameObj.native !== null ? `(` + nameObj.native + `)` : ""}`
    }

    addLiToNav(i) {

        let li = document.createElement("li");
        let a = document.createElement("a");
        let span;
        a.classList.add("page-link");
        a.href = "#";

        if (typeof i === "string") {
            span = document.createElement("span");
            span.innerHTML = i;
            span.setAttribute("aria-hidden","true");
            li.classList.add("page-item");            
            a.appendChild(span);
            li.appendChild(a);
            this.navUl.appendChild(li);

        } else {
            if (i == this.actualPage) {
                li.classList.add("page-item", "active");
            } else {
                li.classList.add("page-item");
            }
            a.textContent = i;
            li.appendChild(a);
            this.navUl.appendChild(li);
        }        
    }
    

    addEventLiNav() {

        this.navUl.addEventListener("click", (e) => {

            if (e.target && (e.target.nodeName == "LI" || e.target.nodeName == "A")) {
                console.log(e.target);
                this.actualPage = parseInt(e.target.textContent);
                //this.VASearchPagination();
                
                this.showStuffs(this.matchesEl,this.callbackWorks);
            }


        });

    }

    showPages(totalItens, perPage=10) {
        this.navUl.innerHTML = "";
        this.navEl.classList.remove("d-none");
        let totalPages = Math.ceil(totalItens / perPage);

        if (this.actualPage > 1) {
            this.addLiToNav("&laquo;");
        }
        let limit=totalPages>5?5:totalPages;
        
        for(let i=1;i<=limit;i++){
            let shift=0;
            let pg=0;
            if(this.actualPage-2<1){
                shift=(this.actualPage-1);                
            }else if(!this.actualPage+2>totalPages){
                shift=2; 
            }else{
                shift=(4-(totalPages-this.actualPage))-(5-limit);                                      
            }

            pg=this.actualPage+i-shift-1;
            this.addLiToNav(pg);            
        }
        if (this.actualPage < totalPages) {
            this.addLiToNav("&raquo;");
        }
        
    }

    setOptions(selecting,params={}) {
        //let pag = page;
        if (!params.page) {
            params.page = 1;
        }
        let query = this.setQuery(selecting,params);
        
        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: params
            })
        };


    }
    setQuery(selecting=true,params) {
        return Query.getQuery(selecting,params);
    }


    handleResponse(response) {
        return response.json().then(function (json) {
            return response.ok ? json : Promise.reject(json);
        });
    }

    handleError(error) {
        alert('Error, check console');
        console.error(error);
    }


}

