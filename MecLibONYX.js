function initMecLib(divId) {
   // remove all pending MathJax tasks from the queue
   window.MathJax.Hub.queue = window.MathJax.Callback.Queue();
   
   // infobox settings, further settings after board initiation
   //JXG.Options.infobox.layer = 11;// defaultMecLayer+5;
   JXG.Options.infobox.strokeColor = 'black';
   JXG.Options.infobox.cssStyle = 'background-color: #ffffffdd;'
   // snap settings. Interactive objects are handled explicity
   JXG.Options.point.snapToGrid = false; // grid snap spoils rotated static objects
   JXG.Options.point.snapSizeX = 0.1;
   JXG.Options.point.snapSizeY = 0.1;
   // interactive objects are released explicitly
   JXG.Options.point.fixed = true; 
   JXG.Options.line.fixed = true; 
   JXG.Options.circle.fixed = true;
   // label settings
   JXG.Options.text.useMathJax = true;
   JXG.Options.text.parse = false;
   JXG.Options.label.useMathJax = true;
   JXG.Options.label.offset = [0, 0];
   JXG.Options.label.anchorY = 'middle';
   // suppress automatic labels
   JXG.Options.point.name = ""; 
   // highlighting is activated explicitly for interactive objects
   JXG.Options.curve.highlight = false;
   JXG.Options.label.highlight = false;
   JXG.Options.text.highlight = false;
   JXG.Options.circle.highlight = false;
   JXG.Options.line.highlight = false;
   JXG.Options.polygon.highlight = false;
   JXG.Options.polygon.borders.highlight = false;
   JXG.Options.point.highlight = false; 
   // grid control
   JXG.Options.axis.ticks.insertTicks = false;
   JXG.Options.grid.drawZero = true;

   const brdIntern = JXG.JSXGraph.initBoard(divId, {boundingbox: [-5, 5, 5, -5], 
     axis: false, grid:true, showNavigation:false, showCopyright:false, 
     keepAspectRatio:false, resize: {enabled: false, throttle: 200},
     pan: {enabled:false}, //suppress uninteded pan on touchscreens
     keyboard:{enabled:false} //would spoil textinput in momentGen and forceGen
   });  
   return brdIntern;
}

// Funktion: Dynamisches Laden von MecLib
async function runMecLib(board,content,continueFunction,stateRef,fbd_names) {
    try {
        board.showNavigation=false;
        board.showCopyright=false;
        // Skript als Text laden
        const response = await fetch('https://cdn.jsdelivr.net/gh/mkraska/meclib/meclib.js');
        if (!response.ok) throw new Error("HTTP-Fehler! Status: ${response.status}");
        var scriptContent = await response.text();
        // Entferne das erneute Erstellen eines Boards und ergaenze continueFunction 
        var regex = new RegExp('const board = JXG.JSXGraph.initBoard\\(divid' + "[\\s\\S]*?" + '\\}\\);', 'g');
        scriptContent = scriptContent.replace(regex, '');
        regex = RegExp('console\\.log\\(m\\);', 'g');
        scriptContent = scriptContent.replace(regex, '');
        regex = RegExp('size=\\"1\\"', 'g');
        scriptContent = scriptContent.replace(regex, 'size=\\"2\\"');
        scriptContent = "board.suspendUpdate(); " + scriptContent + " board.unsuspendUpdate(); board.update(); "
        // Fuege den Nachfolgecode am Ende des Skripts hinzu
        if (continueFunction) {scriptContent += continueFunction.toString().match(/\{([\s\S]*)\}/)[1];}
        // Modifiziertes Skript erstellen
        // zuvor noch notwendige Variablen fuer das Skript anlegen 
        var centeredLabelStyle =  {size:0, showInfobox:false, label:{offset:[-6,0], 
            anchorX:'left', anchorY:'middle'}};     // Bedeutung im Moment unklar
        var initstring=JSON.stringify(content);
        var divid = board.container;
        mode='';
        eval(scriptContent); // Fuehre den geladenen Code aus
	// auf Changes reagieren und sicherstellen, dass Onyx diese auf dem Server sichert
	stateGap = document.getElementById(stateRef);
	if(stateGap) stateGap.addEventListener('change',()=>{setOnyxGapValue(stateRef,event.target.value);});
	namesGap = document.getElementById(fbd_names);
	if(namesGap) namesGap.addEventListener('change',()=>{setOnyxGapValue(fbd_names,event.target.value);});
	// Textboxes bearbeitbar machen
    	board.objectsList.forEach(obj => {
   	    if (obj.elType === 'text'){
                const i = obj.rendNode.querySelector('input');
                if (i) {JXG.addEvent(i.addEventListener('focus', ()=>{board.suspendUpdate();})); 
                        JXG.addEvent(i.addEventListener('blur',()=>{board.unsuspendUpdate();}));}}
        });
   } catch (error) {
        console.error("Fehler beim Laden von MecLib:", error);
    }
}
