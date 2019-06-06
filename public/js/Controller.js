class Controller {
    
    constructor() {
        /**
         * Selecting HTML Elements
         */
        this.form = document.querySelector(".form-row");
        this.nameOne = document.querySelector("#name-one");
        this.nameTwo = document.querySelector("#name-two");
        this.navEl = document.querySelector(".nav-bar");
        this.searchResultEl = document.querySelector("#results");
        this.matchesEl = document.querySelector("#matches");
        this.matchLiLeft=document.querySelector("#matches-left");
        this.matchLiMiddle=document.querySelector("#matches-middle");
        this.matchLiRight=document.querySelector("#matches-right");
        this.errorEl=document.querySelector(".alert");
        this.vaNamesEl=document.querySelector(".va-names");

        /**
         * Initializing attributes
         */
        this.VANameOne="";
        this.VANameTwo="";
        this.VAOneID = "";
        this.VATwoID = "";
        this.spinner=document.querySelector(".spinner-border");
        this.VARolesOne=[];
        this.VARolesTwo=[];
        this.tempName="";
        this.overlappingRoles=[];
        this.searchVAResult = [];
        this.conn = 'https://graphql.anilist.co';
        this.actualPage = 1;
        this.navUl = document.querySelector(".pagination");

        /**
         * Initializing events
         */
        this.addButtonEvent();
        this.addEventLiNav();
        this.addEventLiSearch();
    }

    addButtonEvent() {
        //Add button submit event
        this.form.addEventListener("submit", (e) => {
            e.preventDefault();
            //Hiding elements when button is clicked
            this.errorEl.classList.add("d-none");
            this.searchResultEl.classList.add("d-none");
            this.navEl.classList.add("d-none");
            if(!this.matchesEl.classList.contains("d-none")){
                this.matchesEl.classList.add("d-none");
            }

            this.actualPage = 1;
            this.searchVAResult = [];

            //saving the form input value
            this.tempName = this.form.input.value;
            let params={
                name:this.tempName
            }

            //Searching for name input and showing loading spinner 
            this.search(true,params);
            this.spinner.classList.remove("d-none");
        });
    }

    search(selecting,params,callback=this.handleData) {
        //To keep the context when calling as callback
        callback=callback.bind(this);
        this.handleError.bind(this);
        
        //Sending query to database
        let options = this.setOptions(selecting,params);
        fetch(this.conn, options).then(this.handleResponse)
            .then(data => callback(data))
            .catch(this.handleError);
    }
    
    //User input error/ no results found
    showError(error){
        this.errorEl.classList.remove("d-none");
        this.errorEl.innerHTML=error;
    }

    
    handleData(data) {
        this.getVAList(data);
    }

    getVAList(data) {
        console.log(data);
        if (data.data.Page.pageInfo.total == 0) {
            //if not found, show error
            this.showError("None found, please try again");
        } else {
            //if found, verify if it has any work         
            let len = data.data.Page.staff.length;
            for (let i = 0; i < len - 1; i++) {                
                if (data.data.Page.staff[i].characters.edges.length > 0) {                   
                    //Push into result array as and obj
                    let va = data.data.Page.staff[i]
                    let obj = {
                        id: va.id,
                        name: va.name
                        }
                    this.searchVAResult.push(obj);              
                }
            }
            //API returns at max 25 results per page
            //If hasNextPage = true, will send request again for next page
            if (data.data.Page.pageInfo.hasNextPage == true) {
                let page = data.data.Page.pageInfo.currentPage + 1;
                let params={
                    name:this.tempName,
                    page
                }
                this.search(true,params);
            } else {
                //If hasNextPage = false
                let totalItems = this.searchVAResult.length;
                this.showContent(this.searchResultEl,this.callbackVASearch,totalItems);
            }
        }
    }

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

    /**
     * Verifying if both are selected to start comparison
     */
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
            this.spinner.classList.remove("d-none");
            this.getDataFromBoth();
        }

    }

    /**
     * Fetching data from selected voice actors
     */    
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

    /**
     * Recursive function that receives data from database
     * and verify the need of getting more pages
     */
    handleDataFromBoth(data){
        let dataA;
        let dataB;
        let params={}
        let sendagain=false;
        
        if(data.data.a){
            dataA=data.data.a;
            this.VARolesOne.push(...dataA.characters.edges);
            //If hasNextPage = true, send again to get next page
            if(dataA.characters.pageInfo.hasNextPage){
                params.id1=this.VAOneID;
                params.page1=dataA.characters.pageInfo.currentPage+1;
                sendagain=true;
            }
        }
        if(data.data.b){
            dataB=data.data.b;
            this.VARolesTwo.push(...dataB.characters.edges);
            //If hasNextPage = true, send again to get next page
            if(dataB.characters.pageInfo.hasNextPage){
                params.id2=this.VATwoID;
                params.page2=dataB.characters.pageInfo.currentPage+1;
                sendagain=true;
            }
        }        
        //arr=array.map(a => ({...a}));
        //If sendagain = true, will send again to get the next page      
        sendagain?this.search(false,params,this.handleDataFromBoth):this.compareWorks();    
    }

    /**
     * Search for overlapping works
     */
    compareWorks(){          
        this.searchVAResult=[];
        this.overlappingRoles=[];       
        this.VARolesOne.forEach(role1=>{
            this.VARolesTwo.forEach(role2=>{
                if(role1.media[0].title.native==role2.media[0].title.native){
                    //Creating new object with the necessary information and pushing into an array as object                    
                    let obj={
                        workname:role1.media[0],
                        name1:role1.node.name,
                        name2:role2.node.name,
                        url:role1.media[0].siteUrl
                    };
                    this.overlappingRoles.push(obj);
                }          
            });
        });

        if(this.overlappingRoles.length<1){
        //If no matches found
            this.showError("No matches found");
        }
        this.actualPage=1;
        let totalItems=this.overlappingRoles.length;
        //mostrar na tela
        this.showContent(this.matchesEl,this.callbackWorks,totalItems);

    }

    /**
     * Showing the search result/ comparison result
     */
    showContent(element,callback,totalItems){
        console.log();    
        element.classList.remove("d-none");
        element.innerHTML="";   
        let perPage=10;
        this.showPages(totalItems,perPage);
        let start=perPage*(this.actualPage - 1);
        let end=start+perPage;
        
        //Binding to keep context
        callback=callback.bind(this);
        callback(totalItems,start,end);

        //Hide loading spinner
        this.spinner.classList.add("d-none");       
        
    }

    /**
     *  Used as callback when calling showContent for showing 
     *  the results of the comparison
     */
    callbackWorks(totalItens,start,end){
        this.vaNamesEl.innerHTML="";
        this.vaNamesEl.innerHTML+=`
            <p class="col-4 d-flex justify-content-center">
                <b>${this.nameOne.innerHTML}</b>
            </p>
            <p class="col-4 offset-4 d-flex justify-content-center">
                <b>${this.nameTwo.innerHTML}</b>
            </p>
        `;
        
        for(let i =start;i<end;i++){
            if(totalItens>i){
                let role=this.overlappingRoles[i];
                let ul=document.createElement("ul");
                ul.innerHTML+=`
                <li id="matches-left" class="list-group-item w">
                ${this.getVAName(role.name1)}
                </li>
                <li id="matches-middle"class="list-group-item w">
                <a href="${this.getUrl(role.url)}">
                ${this.getWorkname(role.workname)}
                </a>
                </li>
                <li id="matches-right"class="list-group-item w">
                ${this.getVAName(role.name2)}
                </li>`;            
                ul.classList.add("list-group","list-group-horizontal");
                this.matchesEl.appendChild(ul);

            }
        } 
    }

     /**
     *  Used as callback when calling showContent for showing 
     *  the results of the search
     */
    callbackVASearch(totalItens,start,end){
        this.searchResultEl.innerHTML="";

        for (let i = start; i < end; i++) {
            if(this.searchVAResult.length>i){
            let va = this.searchVAResult[i];
            
            this.searchResultEl.innerHTML += `<a data-id="${va.id}" href="" class="list-group-item list-group-item-action">
            ${this.getVAName(va.name)}
            </a>`

            }
        }
    }

    /**
     * Adjusting strings to display on screen
     */
    getWorkname(worknameObj){
        let title=`${worknameObj.title.romaji!==null?worknameObj.title.romaji:""} 
                      ${worknameObj.title.native!==null?`(`+worknameObj.title.native+`)`:""} 
        `;
        return title;
    }
    getUrl(url){
        let title=`${url!==null?url:"https://anilist.co/"}
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
    /**
    * End adjusting strings
    */

    /**
     * adding LI to navigation UL
     */
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
    
    /**
     * Adding events to the navigation LI elements
     */
    addEventLiNav() {
        this.navUl.addEventListener("click", (e) => {
            e.preventDefault();
            if (e.target && (e.target.nodeName == "LI" || e.target.nodeName == "A")) {
                        if(e.target.firstChild.innerHTML=="«"){
                            this.actualPage--;
                        }else if(e.target.firstChild.innerHTML=="»"){
                            this.actualPage++;
                        }else{
                            this.actualPage=parseInt(e.target.innerHTML);   
                        }                
                if(this.searchVAResult.length<1){                
                let totalItems=this.overlappingRoles.length;            
                this.showContent(this.matchesEl,this.callbackWorks,totalItems);
                }else{
                let totalItems=this.searchVAResult.length; 
                this.showContent(this.matchesEl,this.callbackVASearch,totalItems);
                }
            }
        });
    }

    /**
     * Creates the navigation menu
     */
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

    /**
     * Setting options for query
     */
    setOptions(selecting,params={}) {

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

    /**
     * Server error/ Query error etc
     */
    handleError(error) {
        alert('Error, check console');
        console.error(error);
    }


}

