// UsageInfo class
//
// Show backup server disk usage status
// 
// url : serverurl/usageinfo
//

var UsageInfo = React.createClass({
  getInitialState: function() {
    return {data:[]};
  },
  loadUsageInfoFromServer: function() {
    var self = this;
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data:data});
        $('#usageBar').progress({percent:this.state.data.ratio});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  componentDidMount: function() {
    this.loadUsageInfoFromServer();
    setInterval(this.loadUsageInfoFromServer, this.props.pollInterval);
    $('#usageinfo').popup({inline: true});
  },
  render: function() {
    return (
      <div className={this.props.className} style={{marginTop:'22px', textAlign:'left'}}>
        <div className="ui active blue small progress" data-percent={this.state.data.ratio} id="usageBar">
          <div className="bar"><div className="progress"></div></div>
          <div className="label">{this.state.data.ratio}% ({this.state.data.use}{this.state.data.useunit}B / {this.state.data.total}{this.state.data.totalunit}B)</div>
        </div>
      </div>
    );}
});


var BackupList = React.createClass({
  getInitialState: function() {
    return({backuplist:[],hostname:'',isrendering:false});
  },
  updateList: function(hostname) {
    var self = this;
    $.ajax({
      url: 'listbackup/?hostname='+hostname,
      dataType : 'json',
      cache: false,
      success: function(data) {
        this.setState({hostname:hostname,backuplist:data,isrendering:true});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  clearList: function() {
    this.setState({backuplist:[],isrendering:false});
  },
  componentDidMount: function() {
    this.props.callback(this);
  },
  downloadImg: function(entry) {
    var downloadPath = "/static/backup/"+entry+"/rear-"+this.state.hostname+".iso";
    window.open(downloadPath);
  },
  render: function() {
    if(!this.state.isrendering) return(<div/>);
    var downloadIcon = "arrow grey circle down icon";
    var backuplist = this.state.backuplist.map(function(entry){
      return (
          <div key={entry} className="item">
            <div className="floated content">
            {entry}
            <i className="arrow grey circle down icon" style={{cursor:'pointer'}} onClick={this.downloadImg.bind(this,entry)}/>
            </div>
          </div>
      )
    }.bind(this));
    return(
      <div className="ui list">
        {backuplist}
      </div>
    );
  }
});

// ServerInfoList class
//
// Create list of backup client list in form of a table
//

var ServerInfoList = React.createClass({
  // Filter view data with a search keyword and
  // sort
  filterData: function(searchWord, sortBy, sortOrder) {
    var checkList = {};
    var viewData=[];
    var data=this.state.data;
    var len = data.length;
    var ip;
    for(var i=0; i<len; i++) {
      data[i].index = i;
      ip = data[i].servip;
      checkList[ip]=this.state.checkList[ip] ? this.state.checkList[ip] : false;
      if(data[i].servname.indexOf(searchWord) > -1 || data[i].servip.indexOf(searchWord) > -1 || data[i].backupstatus.indexOf(searchWord) > -1) {
        if(data[i].backupstatus=='None' || data[i].backupstatus=='Complete') {
          data[i].btn = 'play icon';
          data[i].act = 'run';
        } else {
          data[i].btn = 'minus icon';
          data[i].act = 'cancel';
        }
        viewData.push(data[i]);
      }
    }
    viewData.sort(function(a, b) {
      if(a[sortBy] > b[sortBy]) return sortOrder;
      if(a[sortBy] < b[sortBy]) return sortOrder * -1;
      return 0;
    }.bind(this));
    this.setState({searchWord:searchWord, sortBy:sortBy, sortOrder:sortOrder, viewData:viewData});
  },
  setSearchWord: function(searchWord) {
    this.filterData(searchWord, this.state.sortBy, this.state.sortOrder);
  },
  setSortBy: function(sortword) {
    this.filterData(this.state.searchWord, sortword, this.state.sortOrder * -1);
  },
  loadServerInfoListFromServer: function() {
    var self = this;
    $.ajax({
      url: this.state.infourl,
      dataType: 'json',
      cache: false,
      success: function(data) {
        self.setState({data:data});
        self.filterData(self.state.searchWord, self.state.sortBy, self.state.sortOrder);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.state.infourl, status, err.toString());
      }.bind(this)
    });
  },
  handleSubmit: function(data) {
    var self = this;
    $.ajax({
      url: this.state.infourl,
      dataType: 'json',
      type: 'POST',
      data: JSON.stringify(data),
      success: function(data) {
        self.setState({data:data});
        self.filterData(self.state.searchWord, self.state.sortBy, self.state.sortOrder);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.state.infourl, status, err.toString());
      }.bind(this)
    });
  },
  handleListSubmit: function(cmd) {
    var data={};
    var checkList = {};
    for(var ip in this.state.checkList) {
      checkList[ip] = this.state.checkList[ip];
      if(checkList[ip]) {
        data[ip] = cmd;
        checkList[ip] = false;
      }
    }
    this.setState({checkList:checkList,isChecked:false});
    this.handleSubmit(data);
  },
  getInitialState: function() {
    return {data:[],
            infourl:'/osbackup/',
            usageurl:'/usageinfo/',
            confurl:'/confurl/',
            viewData:[],
            checkList:{},
            isChecked:false,
            selectedList:{},
            isMouseDown:false,
            searchWord:'',
            sortBy:'servname',
            sortOrder:1,
            forceRender:true
           };
  },
  componentDidMount: function() {
    this.setState({infourl:'/osbackup/',
                   usageurl:'/usageinfo/',
                   confurl:'/conf/'
                 });
    this.loadServerInfoListFromServer();
    setInterval(this.loadServerInfoListFromServer, this.props.pollInterval);
  },
  componentDidUpdate: function() {
    $('.ui.sticky').sticky({offset: 10, bottomOffset: 10, context: '#tbbutton'});
  },
  setChecked: function(ip, isChecked) {
    var checkList = this.state.checkList;
    checkList[ip] = isChecked;
    this.setState({checkList:checkList});
  },
  toggleAll: function() {
    var isChecked = !this.state.isChecked;
    var len = this.state.viewData.length;

    for(var i=0; i<len; i++) {
      this.state.checkList[this.state.viewData[i].servip] = isChecked;
    }
    this.setState({isChecked:isChecked});
  },
  startSelect: function(servip) {
    this.setState({isMouseDown:true});
    this.state.selectedList[servip] = true;
  },
  onMouseOver: function(servip) {
    if(this.state.isMouseDown) {
      this.state.selectedList[servip] = true;
    }
  },
  endSelect: function() {
    for(var ip in this.state.selectedList) {
      if(this.state.selectedList[ip] == true) {
        this.state.checkList[ip] = !this.state.checkList[ip];
      }
    }
    this.setState({selectedList:{},isMouseDown:false});
  },
  render: function() {
    var ServerInfoNodes = this.state.viewData.map(function(info) {
      return (
        <ServerInfo
          key={info.servname}
          data={info}
          singleSubmit={this.handleSubmit}
          setChecked={this.setChecked}
          isChecked={this.state.checkList[info.servip]}
          onMouseDown={this.startSelect}
          onMouseOver={this.onMouseOver}
          onMouseUp={this.endSelect}
          confurl={this.state.confurl}
        />
      );
    }.bind(this));
    var targetCheck = React.createElement(TargetCheck, Object.assign({}, {
                                          className:"ui fitted checkbox",
                                          isChecked:this.state.isChecked,
                                          onClick:this.toggleAll
                                         }));
    var usageInfo = React.createElement(UsageInfo, Object.assign({}, {
                                        className:"ui fluid popup",
                                        url:this.state.usageurl,
                                        pollInterval:this.props.pollInterval,
                                        servname:this.props.backupserver,
                                        servip:this.props.backupip
                                       }));
    var SortElement = React.createClass({
      render: function() {
        return (
          <th className={this.props.className} style={{cursor:'pointer'}} onClick={this.handleClick}>
            {this.props.elementName}<i className="sort grey icon"></i>
          </th>
        );
      },
      handleClick: function() {
        this.props.handleClick(this.props.sortName);
      }
    });

    return (
      <div style={{marginTop:'20px'}}>
        <div className="ui two column grid">
          <div className="column"><SearchBar setSearchWord={this.setSearchWord}/></div>
          <div className="column right aligned">
            <div className="ui button" id="usageinfo">
              <i className="info circle icon"></i>
              Server Usage
            </div>
            {usageInfo}
          </div>
        </div>
      <table className="ui selectable compact celled table">
        <thead>
          <tr className="center aligned">
            <th className="collapsing" onClick={this.toggleAll}>
              {targetCheck}
            </th>
            <SortElement className="three wide" handleClick={this.setSortBy} sortName="servname"       elementName="Hostname"/>
            <SortElement className="two wide"   handleClick={this.setSortBy} sortName="servip"         elementName="IP"/>
            <SortElement className="three wide" handleClick={this.setSortBy} sortName="lastbackupinfo" elementName="Last Backup"/>
            <SortElement className="two wide"   handleClick={this.setSortBy} sortName="agentstatus"    elementName="Agent Status"/>
            <SortElement className="two wide"   handleClick={this.setSortBy} sortName="backupstatus"   elementName="Backup Status"/>
            <th className="two wide">Conf</th>
            <th className="two wide">Backup</th>
          </tr>
        </thead>
        <tbody>
          {ServerInfoNodes}
        </tbody>
        <tfoot className="full-width">
          <tr>
            <th></th>
            <th colSpan="7">
              <ActionButton
                label="Backup"
                className="ui right floated small blue basic labeled icon button"
                icon="play icon"
                action="run"
                handleClick={this.handleListSubmit}/>
            </th>
          </tr>
        </tfoot>
      </table>
      </div>
    );
  }
});



// ServerInfo class
//
// Render single line of a backup client information
//

var ServerInfo = React.createClass({
  getInitialState: function() {
    return({backuplist:null,showinglist:false});
  },
  handleSingleSubmit: function(cmd) {
    var data={}
    data[this.props.data.servip] = cmd;
    this.props.singleSubmit(data);
  },
  setChecked: function(isChecked) {
    this.props.setChecked(this.props.data.servip, isChecked);
  },
  onMouseDown: function() {
    this.props.onMouseDown(this.props.data.servip);
  },
  onMouseUp: function() {
    this.props.onMouseUp();
  },
  onMouseOver: function() {
    this.props.onMouseOver(this.props.data.servip);
  },
  downloadImg: function() {
    if(this.props.data.lastbackupinfo!="") {
      var downloadPath = "/static/backup/"+this.props.data.servname+"_"+
                         this.props.data.lastbackupinfo+"/rear-"+this.props.data.servname+".iso";
      window.open(downloadPath);
    }
  },
  registerBackupList: function(Object) {
    this.setState({backuplist:Object});
  },
  listbackup: function() {
    if(this.state.showinglist){
      this.state.backuplist.clearList();
      this.setState({showinglist:false});
    } else {
      this.state.backuplist.updateList(this.props.data.servname);
      this.setState({showinglist:true});
    }
  },
  render: function() {
    var backupstatusicon = "";
    if(this.props.data.backupstatus != "None" && this.props.data.backupstatus != "Complete") {
      backupstatusicon = "ui active centered mini inline loader";
    }
    var backupStatus = React.createElement(BackupStatus, Object.assign({},{
                                           backupstatus:this.props.data.backupstatus,
                                           icon:backupstatusicon
                                           }));
    var targetCheck = React.createElement(TargetCheck, Object.assign({}, {
                                          className:"ui fitted checkbox",
                                          servname:this.props.data.servname,
                                          setChecked:this.setChecked,
                                          isChecked:this.props.isChecked
                                          }));
    var listIcon = "grey list layout icon";
    var downloadLabel = "";
    if(this.props.data.lastbackupinfo!=null && this.props.data.lastbackupinfo!="") {
      downloadLabel = this.props.data.lastbackupinfo+" ["+this.props.data.size+"]";
    }
    var lastBackupInfo = React.createElement(ActionButton, Object.assign({}, {
                                            label:downloadLabel,
                                            className:"",
                                            icon:listIcon,
                                            action:"download",
                                            //handleClick:this.downloadImg
                                            handleClick:this.listbackup
                                            }));
    var confPopup = React.createElement(ConfPopup, Object.assign({}, {
                                        id:'confpopup_'+this.props.data.servname,
                                        className:'ui compact circular icon button',
                                        icon:'setting icon',
                                        description:'Exclude Directories',
                                        inputClassName:'ui icon input',
                                        submitButton:"inverted circular link right arrow icon",
                                        contents:this.props.data.excludedir,
                                        url:this.props.confurl,
                                        servip:this.props.data.servip
                                       }));
    var runBackup = React.createElement(RunBackup, Object.assign({}, {
                                        className:"ui compact circular icon button",
                                        icon:this.props.data.btn,
                                        act:this.props.data.act,
                                        handleClick:this.handleSingleSubmit
                                        }));
    var backupList = React.createElement(BackupList, Object.assign({}, {
                                         callback: this.registerBackupList
                                        }));
//    if(this.props.data.lastbackupinfo==null || this.props.data.lastbackupinfo=="") {
                                          
    var lastbackuptd = React.createElement('div', {className:"ui center aligned"}, lastBackupInfo, backupList);
    return (
      <tr className="center aligned">
        <TbCell contents={targetCheck} classname="collapsing" onClick={this.setChecked.bind(this, !this.props.isChecked)}/>
        <TbCell contents={this.props.data.servname}/>
        <TbCell contents={this.props.data.servip}/>
        <TbCell contents={lastbackuptd}/>
        <TbCell contents={this.props.data.agentstatus}/>
        <TbCell contents={backupStatus}/>
        <TbCell contents={confPopup}/>
        <TbCell contents={runBackup}/>
      </tr>
    );
  }
});

var TargetCheck = React.createClass({
  render: function() {
    var className="";
    if(this.props.isChecked == true) {
      className = "checkmark box icon";
    } else {
      className = "square outline icon";
    }
    return (
      <div className={this.props.className}>
        <i
          className={className}
          style={{cursor:'pointer'}}
          onClick={this.props.onClick || this.onClick}
        />
      </div>
    );
 },
 onClick: function() {
   this.props.setChecked(!this.props.isChecked);
 }
});

var ActionButton = React.createClass({
  handleClick: function() {
    this.props.handleClick(this.props.action);
  },
  render: function() {
    return (
      <div className={this.props.className}>
        {this.props.label}<i className={this.props.icon} style={{cursor:'pointer'}} onClick={this.handleClick}></i>
      </div>
    );
  }
});

var BackupStatus = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.backupstatus}
        <div className={this.props.icon}></div>
      </div>
    );
  }
});

var RunBackup = React.createClass({
  handleClick: function() {
    this.props.handleClick(this.props.act);
  },
  render: function() {
    return (
      <div>
        <button className={this.props.className} onClick={this.handleClick}>
          <i className={this.props.icon} />
        </button>
      </div>
    );
  }
});

var SearchBar = React.createClass({
  getInitialState: function() {
    return ({searchWord:""});
  },
  render: function() {
    return (
      <div className="ui fluid search">
        <div className="ui icon input">
          <input
            className="prompt"
            placeholder="Hostname or IP"
            type="text"
            value={this.state.searchWord}
            onChange={this.onChange}
          />
          <i className="search icon"></i>
        </div>
      </div>
    );
  }, 
  onChange: function(e) {
    this.props.setSearchWord(e.target.value);
    this.setState({searchWord:e.target.value});
  }
});

var TbCell = React.createClass({
  render: function() {
    return (
      <td
        className={this.props.className}
        onClick={this.props.onClick}
        onMouseDown={this.props.onMouseDown}
        onMouseUp={this.props.onMouseUp}
        onMouseOver={this.props.onMouseOver}
        onMouseOut={this.props.onMouseOut}
      >
        {this.props.contents}
      </td>
    );
  }
});

var ConfPopup = React.createClass({
  getInitialState: function() {
    return({contents:this.props.contents});
  },
  componentDidMount: function() {
    $('#'+this.props.id).popup({inline:true, hoverable: false, on: 'click'});
  },
  render: function() {
    return (
      <div>
        <div id={this.props.id} className={this.props.className}>
          <i className={this.props.icon}></i>
        </div>
        <div className="ui popup">
          <p>{this.props.description}</p>
          <div className={this.props.inputClassName}>
            <input placeholder={this.props.contents}
                   value={this.state.contents}
                   onChange={this.handleChange}
                   onKeyUp={this.handleKeyUp}
                   type="text"/>
            <i className={this.props.submitButton} onClick={this.handleSubmit}></i>
          </div>
        </div>
      </div>
    );
  },
  handleKeyUp: function(e) {
    if(e.which === 13) {
      this.handleSubmit();
    }
  },
  handleChange: function(e) {
    this.setState({contents:e.target.value});
  },
  handleSubmit: function() {
    var data={};
    data[this.props.servip] = this.state.contents;
    $.ajax({
      url: this.props.url,
      type: 'POST',
      data: JSON.stringify(data),
      success: function(data) {
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.state.infourl, status, err.toString());
      }.bind(this)
    });
    $('#'+this.props.id).popup('hide');
  }
}); 

ReactDOM.render(
    <ServerInfoList
      pollInterval={5000}
    />,
    document.getElementById('react_content')
);
