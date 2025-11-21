const promptInput = document.getElementById('prompt');
const aspectInput = document.getElementById('aspect');
const sizeInput = document.getElementById('size');
const countInput = document.getElementById('count');
const seedInput = document.getElementById('seed');
const baseInput = document.getElementById('base');
const modelInput = document.getElementById('model');
const apiKeyInput = document.getElementById('api-key');
const rememberCheckbox = document.getElementById('remember');
const toggleKeyBtn = document.getElementById('toggle-key');
const generateBtn = document.getElementById('generate');
const requestPreview = document.getElementById('request-preview');
const gallery = document.getElementById('gallery');
const statusLine = document.getElementById('status-line');
const latencyEl = document.getElementById('latency');
const endpointDisplay = document.getElementById('endpoint-display');
const basePresetBtns = document.querySelectorAll('#base-presets .chip');
const quotaInfo = document.getElementById('quota-info');
const imageChips = document.getElementById('image-chips');
const imagesInput = document.getElementById('images');
const modalitiesInput = document.getElementById('modalities');
const keepHistoryInput = document.getElementById('keep-history');
const resetHistoryBtn = document.getElementById('reset-history');
const responseTextEl = document.getElementById('response-text');
const modelPresetBtns = document.querySelectorAll('#model-presets .chip');
const modelPill = document.getElementById('model-pill');
const modalitiesPill = document.getElementById('modalities-pill');
const dropzone = document.getElementById('dropzone');
const thumbs = document.getElementById('thumbs');
const promptPresetBtns = document.querySelectorAll('#prompt-presets .chip');
const topLoader = document.getElementById('top-loader');
const sizeHint = document.getElementById('size-hint');
const logList = document.getElementById('log-list');

const toast = document.createElement('div');
toast.className = 'toast';
document.body.appendChild(toast);

let selectedImages = [];
let history = [];
let conversation = [];
const MAX_HISTORY = 6;
const HISTORY_KEY = 'gallery_history';
const DEBOUNCE_MS = 300;
const LOG_KEY = 'request_logs';
const LOG_MAX = 60;
let logEntries = [];
const truncateText = (text, limit = 400) => {
  if (!text) return '';
  return text.length > limit ? `${text.slice(0, limit)}…(${text.length} chars)` : text;
};

// 简单防抖，避免频繁重渲染预览
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const promptExamples = [
  '一只穿工装的水獭站在复古胶片相机旁，日式街头黄昏，胶片质感，暖色调，柔和光线，Fujifilm 400H 色彩',
  '日落时分的玻璃穹顶温室，柔和体积光，超写实，摄影感'
];
promptInput.value = promptExamples[0];

const savedKey = localStorage.getItem('gemini_api_key');
if (savedKey) apiKeyInput.value = savedKey;

const showToast = (msg) => {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
};

const buildEndpoint = () => {
  const base = baseInput.value.trim().replace(/\/?$/, '');
  const model = modelInput.value.trim().replace(/^\//, '');
  if (!base && !model) return '';
  if (!base) return model;
  if (!model) return base;
  return `${base}/${model}`;
};

const updateEndpointDisplay = () => {
  endpointDisplay.textContent = buildEndpoint() || '请填写 Base 与模型路径';
};

const toInlineData = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    const base64 = result.split(',')[1];
    resolve({
      name: file.name,
      mimeType: file.type || 'image/png',
      data: base64,
      size: file.size
    });
  };
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

const dataUrlToInlineData = (url, name = 'gallery.png') => {
  const [meta, base64] = url.split(',');
  const mimeMatch = meta.match(/data:(.*);base64/);
  return {
    name,
    mimeType: mimeMatch ? mimeMatch[1] : 'image/png',
    data: base64,
    size: Math.round((base64.length * 3) / 4)
  };
};

const renderThumbs = () => {
  thumbs.innerHTML = '';
  if (!selectedImages.length) return;
  selectedImages.forEach((img, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    const imageEl = document.createElement('img');
    imageEl.src = `data:${img.mimeType};base64,${img.data}`;
    const meta = document.createElement('div');
    meta.className = 'thumb-meta';
    const sizeKb = Math.round(img.size / 1024);
    meta.innerHTML = `<span>${idx + 1}. ${img.name}</span><span>${sizeKb} KB</span>`;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '移除';
    removeBtn.onclick = () => {
      selectedImages = selectedImages.filter((_, i) => i !== idx);
      renderThumbs();
      renderImageChips();
      refreshPreview();
    };
    meta.appendChild(removeBtn);
    thumb.append(imageEl, meta);
    thumbs.appendChild(thumb);
  });
};

const renderImageChips = () => {
  if (!selectedImages.length) {
    imageChips.innerHTML = '<span class="muted">未选择参考图</span>';
    thumbs.innerHTML = '';
    return;
  }
  imageChips.innerHTML = '';
  selectedImages.forEach((img, idx) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.type = 'button';
    chip.textContent = `${idx + 1}. ${img.name}`;
    chip.title = '点击移除';
    chip.onclick = () => {
      selectedImages = selectedImages.filter((_, i) => i !== idx);
      renderImageChips();
      renderThumbs();
      refreshPreview();
    };
    imageChips.appendChild(chip);
  });
  renderThumbs();
};

const renderLogs = () => {
  if (!logList) return;
  logList.innerHTML = '';
  if (!logEntries.length) {
    logList.innerHTML = '<div class="muted">暂无日志</div>';
    return;
  }
  logEntries.forEach((log) => {
    const div = document.createElement('div');
    div.className = `log-entry ${log.level}`;
    const metaText = Object.entries(log.meta || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
    div.innerHTML = `
      <div class="log-top">
        <span class="log-time">${log.time}</span>
        <span class="log-badge">${log.level.toUpperCase()}</span>
      </div>
      <div class="log-msg">${log.message}</div>
      ${metaText ? `<div class="log-meta">${metaText}</div>` : ''}
    `;
    logList.appendChild(div);
  });
};

const addLog = (level, message, meta = {}) => {
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  const entry = { level, message, meta, time };
  logEntries = [entry, ...logEntries].slice(0, LOG_MAX);
  saveLogs();
  renderLogs();
};

const saveLogs = () => {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logEntries));
  } catch (e) {
    /* ignore */
  }
};

const loadLogs = () => {
  try {
    const saved = localStorage.getItem(LOG_KEY);
    if (saved) {
      logEntries = JSON.parse(saved) || [];
    }
  } catch (e) {
    /* ignore */
  }
};

const handleFiles = async (files) => {
  const limited = Array.from(files).slice(0, 14);
  if (!limited.length) return;
  statusLine.textContent = '读取参考图…';
  try {
    const encoded = await Promise.all(limited.map(toInlineData));
    // 采用“追加”策略，允许分批上传；保持最多 14 张
    selectedImages = [...selectedImages, ...encoded].slice(-14);
    renderImageChips();
    refreshPreview();
    statusLine.textContent = `已加载 ${selectedImages.length} 张参考图`;
  } catch (err) {
    console.error(err);
    showToast('读取图片失败');
    statusLine.textContent = '读取图片失败';
  }
};

imagesInput.addEventListener('change', async (e) => handleFiles(e.target.files));

dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragging'); });
dropzone.addEventListener('dragenter', (e) => { e.preventDefault(); dropzone.classList.add('dragging'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragging');
  if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
});

const buildUserParts = () => {
  const prompt = promptInput.value.trim() || 'An empty prompt';
  const parts = [{ text: prompt }];
  selectedImages.forEach((img) => {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
  });
  return parts;
};

const figureResponseModalities = () => {
  const mode = modalitiesInput.value;
  if (mode === 'IMAGE') return ['IMAGE'];
  if (mode === 'TEXT') return ['TEXT'];
  return ['IMAGE', 'TEXT'];
};

const buildPayload = () => {
  const aspectRatio = aspectInput.value;
  const imageSize = sizeInput.value;
  // 固定 1 张，防止外部修改
  const candidateCount = 1;
  const seed = seedInput.value ? Number(seedInput.value) : undefined;

  const contents = keepHistoryInput.checked ? [...conversation] : [];
  contents.push({ role: 'user', parts: buildUserParts() });

  const generationConfig = {
    responseModalities: figureResponseModalities(),
    imageConfig: { aspectRatio, imageSize },
    candidateCount
  };
  if (seed) generationConfig.seed = seed;

  return { contents, generationConfig };
};

const estimateTokens = (payload) => {
  const modelPath = modelInput.value;
  const isPro = /gemini-3-pro-image-preview/.test(modelPath);
  const isFlash = /gemini-2\.5-flash-image/.test(modelPath);
  const size = payload?.generationConfig?.imageConfig?.imageSize || '1K';
  const perTablePro = { '1K': 1210, '2K': 1210, '4K': 2000 };
  const perTableFlash = { '1K': 1290 };
  const perImage = isPro ? (perTablePro[size] || 1210) : (perTableFlash[size] || 1290);
  const count = payload?.generationConfig?.candidateCount || 1;
  const promptText = payload?.contents?.[payload.contents.length - 1]?.parts?.[0]?.text || '';
  const promptTokens = Math.max(40, Math.round(promptText.length / 3));
  return { perImage, estimated: perImage * count + promptTokens, count };
};

const redactPayload = (payload) => {
  // 深拷贝并折叠 base64，避免预览卡顿
  const clone = JSON.parse(JSON.stringify(payload));
  clone.contents?.forEach((item) => {
    item.parts?.forEach((part) => {
      if (part.inlineData?.data) {
        const len = part.inlineData.data.length;
        part.inlineData.data = `[base64 length=${len}]`;
      }
    });
  });
  return clone;
};

const refreshPreview = () => {
  const payload = buildPayload();
  requestPreview.textContent = JSON.stringify(redactPayload(payload), null, 2);
  updateEndpointDisplay();
  const tokenInfo = estimateTokens(payload);
  quotaInfo.textContent = `预估 ~${tokenInfo.estimated} tokens (单张约 ${tokenInfo.perImage})`;
};
const debouncedRefreshPreview = debounce(refreshPreview, DEBOUNCE_MS);

const parseImagesFromResponse = (data) => {
  const images = [];
  const collect = (node) => {
    if (!node || typeof node !== 'object') return;

    // inlineData / inline_data (base64)
    const holder = node.inlineData || node.inline_data;
    if (holder?.data) {
      images.push({
        url: `data:${holder.mimeType || holder.mime_type || 'image/png'};base64,${holder.data}`,
        mime: holder.mimeType || holder.mime_type || 'image/png'
      });
    }

    // fileData with uri (API 2024+ 有时返回 fileUri)
    const fileHolder = node.fileData || node.file_data;
    if (fileHolder?.fileUri || fileHolder?.file_uri) {
      images.push({
        url: fileHolder.fileUri || fileHolder.file_uri,
        mime: fileHolder.mimeType || fileHolder.mime_type || 'image/png'
      });
    }

    // 兼容 media / uri 字段
    if (node.uri && typeof node.uri === 'string' && node.uri.startsWith('http')) {
      images.push({ url: node.uri, mime: 'image/png' });
    }

    // 遍历子节点
    Object.values(node).forEach((v) => {
      if (Array.isArray(v)) v.forEach(collect);
      else if (typeof v === 'object') collect(v);
    });
  };

  collect(data);
  return images;
};

const parseTextFromResponse = (data) => {
  const candidates = data?.candidates || [];
  const parts = candidates.flatMap((c) => c?.content?.parts || []);
  return parts.filter((p) => p.text).map((p) => p.text).join('\n');
};

const setLoading = (isLoading) => {
  generateBtn.disabled = isLoading;
  generateBtn.textContent = isLoading ? '生成中…' : '立即生成';
  statusLine.textContent = isLoading ? '正在请求 Gemini…' : '待发起';
  topLoader.hidden = !isLoading;
};

const updateGallery = (items) => {
  history = [...items, ...history].slice(0, MAX_HISTORY);
  gallery.classList.remove('empty');
  gallery.innerHTML = '';

  history.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = 'Generated image';
    img.style.cursor = 'zoom-in';
    img.onclick = () => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.9);
        z-index: 999; display: grid; place-items: center;
        cursor: zoom-out;
      `;
      const bigImg = document.createElement('img');
      bigImg.src = item.url;
      bigImg.style.maxWidth = '90vw';
      bigImg.style.maxHeight = '90vh';
      modal.appendChild(bigImg);
      modal.onclick = () => modal.remove();
      document.body.appendChild(modal);
    };
    const status = document.createElement('div');
    status.className = 'status-pill';
    status.textContent = `${item.aspect} · ${item.size}`;

    const meta = document.createElement('div');
    meta.className = 'meta';
    const left = document.createElement('div');
    left.innerHTML = `<span>${item.prompt.slice(0, 48)}${item.prompt.length > 48 ? '…' : ''}</span>`;
    const actions = document.createElement('div');
    actions.className = 'btn-row';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'ghost';
    downloadBtn.textContent = '下载';
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = item.url;
      a.download = `gemini-${Date.now()}.png`;
      a.click();
    };

    const copyBtn = document.createElement('button');
    copyBtn.className = 'ghost';
    copyBtn.textContent = '复制 DataURL';
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(item.url);
        showToast('已复制 DataURL');
      } catch (err) {
        showToast('复制失败');
      }
    };

    const reuseBtn = document.createElement('button');
    reuseBtn.className = 'ghost';
    reuseBtn.textContent = '设为参考';
    reuseBtn.onclick = () => {
      const inline = dataUrlToInlineData(item.url, `gallery-${index + 1}.png`);
      selectedImages = [...selectedImages, inline].slice(-14);
      renderImageChips();
      refreshPreview();
      showToast('已加入参考图');
    };

    const exportBtn = document.createElement('button');
    exportBtn.className = 'ghost';
    exportBtn.textContent = '复制 JSON';
    exportBtn.onclick = async () => {
      const minimal = {
        prompt: item.prompt,
        aspect: item.aspect,
        size: item.size,
        text: item.text,
        images: [item.url]
      };
      try {
        await navigator.clipboard.writeText(JSON.stringify(minimal, null, 2));
        showToast('已复制 JSON');
      } catch (err) {
        showToast('复制失败');
      }
    };

    actions.append(downloadBtn, copyBtn, reuseBtn, exportBtn);
    meta.append(left, actions);

    card.append(status, img, meta);
    gallery.appendChild(card);
  });
  saveHistory();
};

const resetConversation = () => {
  conversation = [];
  responseTextEl.textContent = '等待请求…';
};

const saveHistory = () => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    /* ignore quota */
  }
};

const loadHistory = () => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      history = JSON.parse(saved);
      updateGallery([]); // 渲染已有记录
    }
  } catch (e) {
    /* ignore */
  }
};

const parseErrorMessage = (status, statusText, rawText, json) => {
  const code = json?.error?.code || json?.code;
  if (code === 'INVALID_API_KEY') return '❌ API Key 无效，请检查后重试';
  if (code === 'QUOTA_EXCEEDED') return '⚠️ 配额已用完，请稍后再试';
  if (code === 401) return '❌ 未授权或 Key 无效';
  return json?.error?.message || json?.message || rawText || `请求失败 (${status}): ${statusText}`;
};

const handleGenerate = async () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) return showToast('请先填写 API Key');
  const base = baseInput.value.trim();
  const model = modelInput.value.trim();
  if (!base) return showToast('请填写 Base 域名');
  if (!model) return showToast('请填写模型路径');

  const endpoint = buildEndpoint();
  const payload = buildPayload();
  refreshPreview();
  addLog('info', '开始请求', {
    endpoint,
    model,
    aspect: payload.generationConfig.imageConfig.aspectRatio,
    size: payload.generationConfig.imageConfig.imageSize,
    modality: figureResponseModalities().join('+')
  });

  if (rememberCheckbox.checked) {
    localStorage.setItem('gemini_api_key', apiKey);
  } else {
    localStorage.removeItem('gemini_api_key');
  }

  setLoading(true);
  const start = performance.now();
  let alreadyLogged = false;
  try {
    const response = await fetch('/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, apiKey, payload })
    });

    const rawText = await response.text();
    let data = null;
    try { data = JSON.parse(rawText); } catch (e) { data = null; }

    if (!response.ok) {
      const message = parseErrorMessage(response.status, response.statusText, rawText, data);
      addLog('error', message, { status: response.status, endpoint, body: truncateText(rawText) });
      alreadyLogged = true;
      throw new Error(message);
    }

    if (!data) data = {};
    const images = parseImagesFromResponse(data);
    const text = parseTextFromResponse(data);
    responseTextEl.textContent = text || '无文本回应或未开启 TEXT 模式';

    const elapsed = Math.round(performance.now() - start);
    latencyEl.textContent = `${elapsed} ms`;
    statusLine.textContent = text ? text.slice(0, 50) + (text.length > 50 ? '…' : '') : '生成完成';
    const usage = data?.usageMetadata;
    if (usage) {
      quotaInfo.textContent = `input ${usage.promptTokenCount || usage.promptTokens || 0}, output ${usage.candidatesTokenCount || usage.candidatesTokens || usage.totalTokenCount || 0} tokens`;
    }
    addLog('success', '生成成功', {
      status: response.status,
      elapsed: `${elapsed} ms`,
      images: images.length,
      tokens: usage ? `${usage.promptTokenCount || usage.promptTokens || 0} / ${usage.candidatesTokenCount || usage.candidatesTokens || usage.totalTokenCount || 0}` : '未知',
      body: truncateText(rawText)
    });

    if (!images.length && figureResponseModalities().includes('IMAGE')) {
      showToast('已返回响应，但未发现图片；请检查响应内容/配额或开启 TEXT 查看报错');
      addLog('warn', '未发现图片', { status: response.status, body: truncateText(rawText) });
      return;
    }

    const items = images.map((img) => ({
      url: img.url,
      prompt: payload.contents[payload.contents.length - 1].parts[0].text,
      aspect: payload.generationConfig.imageConfig.aspectRatio,
      size: payload.generationConfig.imageConfig.imageSize,
      text
    }));
    if (items.length) updateGallery(items);
    showToast(`生成成功${images.length ? ' (' + images.length + ' 张)' : ''}`);

    if (keepHistoryInput.checked) {
      const userText = payload.contents[payload.contents.length - 1].parts[0].text;
      conversation.push({ role: 'user', parts: [{ text: userText }] });
      if (text) conversation.push({ role: 'model', parts: [{ text }] });
    }
  } catch (err) {
    console.error(err);
    statusLine.textContent = err.message;
    responseTextEl.textContent = err.message;
    showToast('请求出错：' + err.message);
    if (!alreadyLogged) addLog('error', err.message, { endpoint });
  } finally {
    setLoading(false);
  }
};

modelPresetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    modelPresetBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    modelInput.value = btn.dataset.path;
    modelPill.textContent = btn.dataset.path.split('/').pop();
    const isFlash = btn.dataset.model === 'flash';
    Array.from(sizeInput.options).forEach((opt) => {
      const disallow = isFlash && opt.value !== '1K';
      opt.disabled = disallow;
      if (disallow) opt.textContent = `${opt.value} (Flash 不支持)`;
      else {
        opt.textContent = opt.value;
      }
    });
    if (isFlash) sizeInput.value = '1K';
    sizeHint.textContent = isFlash ? 'Flash 仅支持 1K；更快更省' : 'Pro 支持 1K / 2K / 4K';
    refreshPreview();
  });
});

basePresetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    basePresetBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    baseInput.value = btn.dataset.base;
    refreshPreview();
    showToast(btn.dataset.base ? '已填入推荐 Base' : '已清空 Base');
  });
});

promptPresetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    promptInput.value = btn.dataset.prompt;
    refreshPreview();
  });
});

toggleKeyBtn.addEventListener('click', () => {
  const type = apiKeyInput.type === 'password' ? 'text' : 'password';
  apiKeyInput.type = type;
  toggleKeyBtn.textContent = type === 'password' ? '显示' : '隐藏';
});

generateBtn.addEventListener('click', (e) => {
  e.preventDefault();
  handleGenerate();
});

resetHistoryBtn.addEventListener('click', () => {
  resetConversation();
  showToast('已清空会话记忆');
});

promptInput.addEventListener('input', debouncedRefreshPreview);
[aspectInput, sizeInput, countInput, seedInput, baseInput, modelInput, modalitiesInput].forEach((el) => {
  el.addEventListener('input', () => {
    if (el === modalitiesInput) modalitiesPill.textContent = modalitiesInput.value.replace('_', ' + ');
    refreshPreview();
  });
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    handleGenerate();
  }
  if (e.key === 'Escape') {
    resetConversation();
    showToast('已重置会话');
  }
});

renderImageChips();
loadHistory();
refreshPreview();
updateEndpointDisplay();
loadLogs();
renderLogs();
