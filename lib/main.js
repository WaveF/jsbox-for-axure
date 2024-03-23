/**
 * 
 * AxLib - JsBox
 * 
 * Author: WaveF
 * QQ: 298010937
 * 
 **/
import './axlib-v3.min.js';

(function(){

  main();

  function main() {
    if (window.AxJsBox) {
      console.error('请先加载 axlib!');
      return;
    }

    window.AxJsBox = {
      name: 'jsbox',
      version: '2.4.14',
      author: 'wavef',
      contact: 'wavef@live.com',
      instances: [],
      log: function(textInfo, expand=true) {
        const style = 'color:#06f;';
        console[expand?'group':'groupCollapsed']('%cJSBOX', style);
        console.log(textInfo);
        console.groupEnd();
      }
    };

    // 添加一个快速获取和设置id的方法
    $.fn.id = function () {
      if (arguments.length == 0) {
        return this.attr('id');
      } else if (arguments.length == 1) {
        this.attr('id', arguments[0]);
      }
    };

    inited();
  }

  function inited() {
    /*// 在清空中继器数据的情况下仍然可用（由于兼容问题暂时封印）
    let repTempScriptTags = $('script[type=axure-repeater-template]');
    $.each(repTempScriptTags, (idx,item) => {
      let repTempScriptContent = $(item).text();
      let userScript;
      if (repTempScriptContent.includes('ax-jsbox')) {
        userScript = repTempScriptContent.split('\<textarea')[1];
        userScript = userScript.split('\>').slice(1).join('\>');
        userScript = userScript.split('\<\/textarea\>')[0];
        userScript = unescapeHTML(userScript);
        console.log(userScript);
      }
    });*/

    let $jsboxes = $('div[class*="ax-jsbox"]');
    let repeaterIds = [];
    $.each($jsboxes, (idx, item) => { repeaterIds.push($(item).parent().parent().id()); });
    repeaterIds = [...new Set(repeaterIds)];

    $.each(repeaterIds, (idx, item) => {
      let $rep = $('#'+item);
      let repId = $rep.id();
      let rep = $axure(`#${repId}`);
      let $wrapper = $rep.parent();
      let $jsbox = $rep.children('div').eq(0).children('div[class*=ax-jsbox]');
      let jsboxId = $jsbox.id();
      let $textArea = $jsbox.find('textarea');
      let $textAreas = $rep.find('textarea');
      let textAreaId = $textArea.id();
      let $shape = $jsbox.children(`#${jsboxId}_div`);
      let shapeId = $shape.id();
      let js = formatCode($textArea.val());
      let jsLines = js.split('\n');

      let $view = cloneNode($rep);
      let viewId = $view.id();
      $view.insertAfter($rep);

      let panelRawData = rep.getRepeaterDataOnce({format:'default'});
      let extraRawData = rep.getRepeaterDataDiff({format:'default'});
      // extraRawData.splice(0, panelRawData.length);

      // 获取CDN文件列表
      let filesInExtra = getFileListFromExtraData(extraRawData) || [], filesInTextarea = getFileListFromTextArea(jsLines) || [];
      let files = filesInExtra.concat(filesInTextarea);
      files = [...new Set(files)];

      // 获取编辑器中的import语句
      let esmLines = getEsmLinesFromTextArea(jsLines) || [];

      // 注释掉编辑器中的import语句，因为import只能出现在第一行
      jsLines  = jsLines.map(line => {
        let result = line;
        if (line.startsWith('import ')) { result = '\/\/ esm:' + line; }
        return result;
      });
      js = jsLines.join('\n');

      // 隐藏中继器
      $rep.hide();

      // 显示loading动画
      addLoadingSvg($view);

      // 提供JsBox内置方法
      let formatInlineFunction = function (func) {
        return func.toString().replace(/VIEW_ID/g, viewId).replace(/REP_ID/g, repId).replace(/JSBOX_ID/g, jsboxId).replace(/TEXTAREA_ID/g, textAreaId).replace(/  /g, '').trim();
      };

      let clearAllTextareas = function () {
        $('#REP_ID').children('div').find('div[class*="ax-jsbox"]').children('textarea').html('');
      };

      let getAllTextareas = function () {
        return $('#REP_ID').children('div').find('div[class*="ax-jsbox"]').children('textarea');
      };

      let getTextarea = function () {
        return $axure('#TEXTAREA_ID');
      };

      let getRepeater = function () {
        return $axure('#REP_ID');
      };

      let getView = function () {
        return $axure('#VIEW_ID');
      };

      let runScript = function (jsUrl) {
        $.get(jsUrl, script => eval(script));
      };

      let setText = function (text) {
        $('#TEXTAREA_ID').val(text);
      };

      let getText = function () {
        return $('#TEXTAREA_ID').val();
      };

      let setValues = function (arr, marker='/') {
        $('#TEXTAREA_ID').val(marker + arr.join(marker));
        return `[[ This.text.slice(This.text.split("${marker}", 序号).length+1).split("${marker}", 1) ]]`;
      };

      let emit = function (action, target) {
        target = target || $axure('#JSBOX_ID');
        if (action.toLowerCase() === 'moved') {
          target.moveBy(0,0,{});
        }
        else if (action==='selected') {
          target.selected(true);
        }
        else if (action==='unselected') {
          target.selected(false);
        }
        else if (action==='toggleSelect') {
          target.selected(!target.selected());
        }
      };

      let showView = function (alpha, pointerEvents) {
        alpha = alpha || 1;
        pointerEvents = pointerEvents || true;
        $('#VIEW_ID').show().css({
          'opacity': alpha,
          'pointer-events': pointerEvents ? 'auto' : 'none'
        });
      };

      let hideView = function () {
        $('#VIEW_ID').hide();
      };

      let setViewStyle = function(css) {
        css = css == 'none' ? { 'border': 'none', 'background-color': 'transparent' } : css;
        $('#VIEW_ID').css(css);
      };

      let showLoading = function () {
        setTimeout(()=>{ $('#VIEW_ID').children('.ax-loading').show(); }, 0);
      };

      let hideLoading = function () {
        setTimeout(()=>{ $('#VIEW_ID').children('.ax-loading').fadeOut(); }, 0);
      };

      let appendHTML = function (str, target) {
        target = target || $('#VIEW_ID');
        target.append(str);
      };

      let setHTML = function (str, target) {
        target = target || $('#VIEW_ID');
        target.html(str);
      };

      let appendCSS = function (str) {
        $('head').append('<style>' + str + '</style>');
      };

      let appendJS = function (jsText,type='text/javascript') {
        const s=document.createElement('script');
        s.type=type;
        s.textContent=jsText;
        document.body.appendChild(s);
      };

      let getUserElements = function () {
        let _els = [];
        let wrapper = $('#REP_ID').children('div').eq(0);
        
        $.each(wrapper.children(), (idx,item) => {
          if (!item.className.includes('ax-jsbox')) {
            _els.push(item);
          }
        });
        return _els;
      };

      let showUserElements = showUI = function () {
        THIS.$view.append(THIS.getUserElements());
      };

      let getDataOnce = function (format) {
        return $axure('#REP_ID').getRepeaterDataOnce(format);
      };

      let getExtraData = function (format) {
        return $axure('#REP_ID').getRepeaterDataDiff(format);
      };

      let getLatestData = function (format) {
        return $axure('#REP_ID').getRepeaterData(format);
      };

      let deleteData = function (linesCount) {
        $axure('#REP_ID').deleteRepeaterData(linesCount);
        $axure('#REP_ID').refreshRepeater();
      };

      let clearExtraData = function() {
        let _exData = $axure('#REP_ID').getRepeaterDataDiff();
        $axure('#REP_ID').deleteRepeaterData(_exData.length);
        $axure('#REP_ID').refreshRepeater();
      };

      let clearData = function () {
        $axure('#REP_ID').clearRepeaterData();
        $axure('#REP_ID').refreshRepeater();
      };
      
      let getNode = function (el) {
        let _id, _node;
        if (el.$ !== undefined) {
          _id = el.$().attr('id');
          _node = $(`#${_id}`).get(0);
        } else if (el.jquery !== undefined) {
          _id = el.attr('id');
          _node = $(`#${_id}`).get(0);
        } else if (el.tagName !== undefined) {
          _id = el.id;
          _node = $(`#${_id}`).get(0);
        }
        return _node;
      };

      let loadJS = function (url,cb) {
        let script = document.createElement('script');
        script.onload = cb;
        script.src = url;
        $('head').appendChild(script);
      };

      let loadCSS = function (url) {
        $('head').append('<link text="text/css" href="' + url + '" rel="Stylesheet" />');
      };
      
      let injectCode = `;const Loader = window.yepnope;let THIS = {
        files: ${`["${files.join('\",\"')}"]`},
        vid: '${viewId}',
        view: $axure('#${viewId}'),
        $view: $axure('#${viewId}').$(),
        rid: '${repId}',
        repeater: $axure('#${repId}'),
        $repeater: $('#${repId}'),
        textarea: $axure('#${textAreaId}'),
        $textarea: $('#${textAreaId}'),
        $textareas: $('#${repId}').find('textarea'),
        $jsbox: $axure('#${jsboxId}').$(),
        shape: $axure('#${shapeId}'),
        $shape: $axure('#${shapeId}').$(),
        size: { width:${ $jsbox.width() }, height:${ $jsbox.height() } },
        position: { x:${ $jsbox.position().left }, y:${ $jsbox.position().top } },
        clearAllTextareas: ${formatInlineFunction(clearAllTextareas)},
        getAllTextareas: ${formatInlineFunction(getAllTextareas)},
        getTextarea: ${formatInlineFunction(getTextarea)},
        getRepeater: ${formatInlineFunction(getRepeater)},
        getView: ${formatInlineFunction(getView)},
        setText: ${formatInlineFunction(setText)},
        getText: ${formatInlineFunction(getText)},
        setValues: ${formatInlineFunction(setValues)},
        emit: ${formatInlineFunction(emit)},
        getUserElements: ${formatInlineFunction(getUserElements)},
        showUserElements: ${formatInlineFunction(showUserElements)},
        showUI: ${formatInlineFunction(showUI)},
        getData: ${formatInlineFunction(getDataOnce)},
        getDataOnce: ${formatInlineFunction(getDataOnce)},
        getExtraData: ${formatInlineFunction(getExtraData)},
        getLatestData: ${formatInlineFunction(getLatestData)},
        deleteData: ${formatInlineFunction(deleteData)},
        clearExtraData: ${formatInlineFunction(clearExtraData)},
        clearData: ${formatInlineFunction(clearData)},
        appendHTML: ${formatInlineFunction(appendHTML)},
        setHTML: ${formatInlineFunction(setHTML)},
        appendCSS: ${formatInlineFunction(appendCSS)},
        appendJS: ${formatInlineFunction(appendJS)},
        showView: ${formatInlineFunction(showView)},
        hideView: ${formatInlineFunction(hideView)},
        setViewStyle: ${formatInlineFunction(setViewStyle)},
        showLoading: ${formatInlineFunction(showLoading)},
        hideLoading: ${formatInlineFunction(hideLoading)},
        runScript: ${formatInlineFunction(runScript)},
        getNode: ${formatInlineFunction(getNode)},
        loadJS: ${formatInlineFunction(loadJS)},
        loadCSS: ${formatInlineFunction(loadCSS)},
        loadOnce: axlib.loadOnce,
      };
      let JSBOX = THIS;
      if(AxJsBox.instances){AxJsBox.instances.push(THIS);}
      else if(AxJsBox.elements){AxJsBox.elements.push(THIS);}
      `;
      injectCode = injectCode.replace(/\s\s+/g, '').replace(/\n/g, ''); /* 替换连续空格为换行符 */
      injectCode = [
        '\/* inject begin *\/',
        injectCode,
        '\/* inject end *\/\n'
      ].join('\n');
      js = injectCode + js;
      js = esmLines.join(';\n') + `;(function(){\n${js}\n}());`; /* 提升ESM语句 */
      
      let jsType = getScriptTypeFromTextArea(jsLines);
      let jsSyncMode = getScriptSyncModeFromTextArea(jsLines);
      if (files.length === 0) {
        finalAppend($view, js, jsType, jsSyncMode);
      } else {
        yepnope({
          load: files,
          complete: ()=>{
            finalAppend($view, js, jsType, jsSyncMode);
          }
        });
      }
    });
  }

  function finalAppend(container, js, type, syncMode) {
    // container.append(`<script class="jsbox-script" type="${type}" ${syncMode}>${js}</script>`);

    // 用这种写法才能触发ESM代码执行
    const script = document.createElement('script');
    script.type = type;
    script.className = 'jsbox-script';
    script.textContent = js;
    document.body.appendChild(script);

    container.find('.ax-loading').hide();
  }

  function formatCode(code) {
    // return code.replace(/ /gi, '').replace(/  +/g, ' ').replace(/\s\s+/g, ' ');

    let pattern = '\/\/ @import ';
    let lines = code.split('\n');
    lines = lines.map(line => {
      if (line.startsWith('\/\/import')) { return line.replace('\/\/import', pattern); }
      else if (line.startsWith('\/\/ import')) { return line.replace('\/\/ import', pattern); }

      else if (line.startsWith('\/\/include')) { return line.replace('\/\/include', pattern); }
      else if (line.startsWith('\/\/ include')) { return line.replace('\/\/ include', pattern); }

      // else if (line.startsWith('\/\/@import')) { return line.replace('\/\/@import', pattern); }
      // else if (line.startsWith('@import')) { return line.replace('@import', pattern); }
      else { return line; }
    });

    let result = lines.join('\n');
    result = result.replace(/ /gi, '').replace(/  +/g, ' ').replace(/\n +/g, '\n').replace(/\n\n+/g, '\n');

    return result;
  }

  function addLoadingSvg(target, options) {
    options = options || { color:'#D1D5DB', opacity:0.2, scale:1.2, delay:0, dur:1, blending:'difference' };

    let svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38" stroke="${options.color}" style="transform:scale(${options.scale});">
        <g fill="none" fill-rule="evenodd">
          <g transform="translate(1 1)" stroke-width="2">
            <circle stroke-opacity="${options.opacity}" cx="18" cy="18" r="18"/>
            <path d="M36 18c0-9.94-8.06-18-18-18">
              <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="${options.dur}s" repeatCount="indefinite"/>
            </path>
          </g>
        </g>
      </svg>
    `;

    $('head').append(`
      <style>
        html, body { height: 100%; }
        .ax-loading { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: transparent; z-index: 9999; mix-blend-mode:${options.blending}; pointer-events:none; transform: scale(.5); }
        .ax-loading-svg { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
      </style>
    `);
    $(target).append(`<div class="ax-loading"><div class="ax-loading-svg">${svg}</div></div>`);

    return svg;
  }

  function getFileListFromExtraData(data) {
    let temp = $axure.formatRepeaterData(data, { format: 'row' });
    temp = Object.keys(temp);
    // 如果每一项都以 http 开头，那就是文件列表
    return temp.filter(value => value.substr(0, 4) == 'http');
  }

  function getFileListFromTextArea(lines) {
    let jsFiles = [];
    
    lines.forEach(line => {
      let pattern = '\/\/ @import ';
      if (line.startsWith(pattern)) {
        if (line.includes('=')) {
          jsFiles.push( line.replace(pattern, '').replace('=', '').replace(/\s/g, '').replace(/\'/g, '').replace(/\"/g, '') );
        } else {
          jsFiles.push( line.replace(pattern, '').replace(/\s/g, '') );
        }
      }
    });
    return jsFiles;
  }

  function getEsmLinesFromTextArea(lines) {
    let esm = [];
    lines.forEach((line, index) => {
      if (line.startsWith('import ')) {
        esm.push(line);
      }
    });
    return esm;
  }

  function getScriptTypeFromTextArea(lines) {
    let type = 'text/javascript';
    lines.forEach(line => {
      let str = line.trim();
      const pattern = /^\/\/\stype\s+module$/;
      if (pattern.test(str)) {
        type = 'module';
      }
    });
    return type;
  }

  function getScriptSyncModeFromTextArea(lines) {
    let syncMode = '';
    lines.forEach(line => {
      if (line === '\/\/defer') {
        syncMode = 'defer';
      } else if (line === '\/\/async') {
        syncMode = 'async';
      }
    });
    return syncMode;
  }

  function cloneNode($node) {
    let $clone = $node.clone();
    $clone.children().remove();
    $clone.data('label', '');
    $clone.removeClass('ax_default');
    $clone.addClass($clone.id() + '_clone');
    $clone.id($clone.id() + '_jsbox_view');
    $clone.css({
      'display': 'flex',
      'position': $node.css('position'),
      'left': $node.css('left'),
      'top': $node.css('top'),
      'width': $node.css('width'),
      'height': $node.css('height'),
      'text-align': 'left',
      'border-radius': $node.css('border-radius')
    });
    return $clone;
  }

  function escapeHTML(a){
    a = "" + a;
    return a.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");;
  }

  function unescapeHTML(a){
    a = "" + a;
    return a.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  }

}());