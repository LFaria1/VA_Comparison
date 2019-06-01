class Query{
    static getQuery(search=false,data={}){
        let query;

        if(search){
            query=`
            query($name: String,$page:Int){
              Page(page:$page){
                  pageInfo{
                      total
                      currentPage
                      lastPage
                      hasNextPage
                  }
                  
                  staff(search:$name){
                      characters{
                          edges{
                              id
                              media{
                                title{
                                  romaji
                                }                
                              }
                              node{
                                name {
                                  first
                                  last
                                  native
                                }
                                
                              }             
                          }                          
                      }
                      id
                      name{
                          first
                          last
                          native
                      }
                  }
              }
          }
            `;
        }else{
            
            let sendAgainA=false;
            let sendAgainB=false;

            if(data.id1 && data.page1){
              sendAgainA=true;
            }
            if(data.id2 && data.page2){
              sendAgainB=true;
            }
                       
            query=`query (
            ${sendAgainA?`$id1:Int,$page1:Int`:``},
            ${sendAgainB?`$id2:Int,$page2:Int`:``})`;
            query+=`{`
            query+=`${sendAgainA?`a:Staff (id:$id1){
                id
                name {
                  first
                  last
                  native
                }
                characters(page:$page1) {
                    pageInfo {
                        total
                        perPage
                        currentPage
                        lastPage
                        hasNextPage
                      }
                  edges {
                    node{
                      id
                      name {
                        first
                        last
                        native
                      }
                    }
                    media {
                        siteUrl
                          title {
                            romaji
                            english
                            native
                            userPreferred
                          }
                    }
                  }
                }
              
            }`:``}`;
            query+=`${sendAgainB?`b:Staff (id:$id2){
                id
                name {
                  first
                  last
                  native
                }
                characters(page:$page2) {
                    pageInfo {
                        total
                        perPage
                        currentPage
                        lastPage
                        hasNextPage
                      }
                  edges {
                    node{
                      id
                      name {
                        first
                        last
                        native
                      }
                    }
                    media {
                          title {
                            romaji
                            english
                            native
                            userPreferred
                          }
                    }
                  }
                }
              
            }`:``}`;

            query+=`}`
        }

        return query;

    }

};