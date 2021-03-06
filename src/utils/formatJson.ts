export default function formatJson(txt: string, compress: boolean = false): string {
  let indentChar = '    ', data = {};
  if(!txt) {
    throw new Error('txt is empty')
  }
  try {
     data = eval('(' + txt + ')');
  } catch (e) {
    throw new Error(e)
  };
  let draw = [], last = false, line = compress ? '' : '\n', nodeCount = 0, maxDepth = 0;
  function notify(name, value, isLast, indent, formObj) {
    nodeCount++; /*节点计数*/
    for (var i = 0, tab = ''; i < indent; i++)
        tab += indentChar;
    /* 缩进HTML */
    tab = compress ?
        '' :
        tab; /*压缩模式忽略缩进*/
    maxDepth = ++indent; /*缩进递增并记录*/
    if (value && value.constructor == Array) { /*处理数组*/
        draw.push(tab + (formObj ?
            ('"' + name + '":') :
            '') + '[' + line); /*缩进'[' 然后换行*/
        for (var i = 0; i < value.length; i++)
            notify(i, value[i], i == value.length - 1, indent, false);
        draw.push(tab + ']' + (isLast ?
            line :
            (',' + line))); /*缩进']'换行,若非尾元素则添加逗号*/
    } else if (value && typeof value == 'object') { /*处理对象*/
        draw.push(tab + (formObj ?
            ('"' + name + '":') :
            '') + '{' + line); /*缩进'{' 然后换行*/
        var len = 0,
            i = 0;
        for (var key in value)
            len++;
        for (var key in value)
            notify(key, value[key], ++i == len, indent, true);
        draw.push(tab + '}' + (isLast ?
            line :
            (',' + line))); /*缩进'}'换行,若非尾元素则添加逗号*/
    } else {
        if (typeof value == 'string')
            value = '"' + value + '"';
        draw.push(tab + (formObj
            ?('"' + name + '":')
            :'') + value + (
                isLast
                ?''
                :','
            ) + line);
    };
  }
  var isLast = true,
  indent = 0;
  notify('', data, isLast, indent, false);
  return draw.join('');
}