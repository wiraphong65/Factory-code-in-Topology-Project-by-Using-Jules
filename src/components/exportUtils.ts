import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';
// toPng import removed - not used in current implementation

// ฟังก์ชันคำนวณ bounding box ของ nodes และ edges แบบมี padding
export const getBoundingBoxFromDiagram = (nodes: ReactFlowNode[], edges: ReactFlowEdge[]) => {
  if (!nodes.length) return null;

  let xMin = Infinity, yMin = Infinity;
  let xMax = -Infinity, yMax = -Infinity;

  // คำนวณจาก nodes
  nodes.forEach((node) => {
    const { x, y } = node.position;
    // ใช้ขนาดจริงของ node หรือขนาดเริ่มต้นตามประเภท
    let width = node.width || 150;
    let height = node.height || 40;

    // ปรับขนาดตามประเภท node
    switch (node.type) {
      case 'router':
      case 'switch':
      case 'firewall':
        width = node.width || 120;
        height = node.height || 80;
        break;
      case 'server':
        width = node.width || 100;
        height = node.height || 120;
        break;
      case 'pc':
        width = node.width || 80;
        height = node.height || 100;
        break;
    }

    xMin = Math.min(xMin, x);
    yMin = Math.min(yMin, y);
    xMax = Math.max(xMax, x + width);
    yMax = Math.max(yMax, y + height);
  });

  // คำนวณจาก edges (เส้นเชื่อมต่อ) เพื่อให้แน่ใจว่าไม่ตัดเส้น
  edges.forEach((edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (sourceNode && targetNode) {
      // คำนวณจุดเชื่อมต่อของเส้น
      const sourceX = sourceNode.position.x + (sourceNode.width || 150) / 2;
      const sourceY = sourceNode.position.y + (sourceNode.height || 40) / 2;
      const targetX = targetNode.position.x + (targetNode.width || 150) / 2;
      const targetY = targetNode.position.y + (targetNode.height || 40) / 2;

      // เพิ่มพื้นที่สำหรับเส้นโค้ง
      const curveOffset = 20;
      xMin = Math.min(xMin, sourceX - curveOffset, targetX - curveOffset);
      yMin = Math.min(yMin, sourceY - curveOffset, targetY - curveOffset);
      xMax = Math.max(xMax, sourceX + curveOffset, targetX + curveOffset);
      yMax = Math.max(yMax, sourceY + curveOffset, targetY + curveOffset);
    }
  });

  return { xMin, yMin, xMax, yMax };
};

// ฟังก์ชันสำหรับ export ในรูปแบบ SVG โดยใช้ ReactFlow API โดยตรง
export const exportAsSvgFormat = async (
  reactFlowElement: HTMLElement,
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  fileName: string
): Promise<boolean> => {
  try {
    if (!reactFlowElement || nodes.length === 0) {
      return false;
    }

    // คำนวณ bounding box
    const box = getBoundingBoxFromDiagram(nodes, edges);
    if (!box) return false;

    // เพิ่ม padding รอบๆ diagram
    const padding = 80; // เดิม 50, เพิ่มเป็น 80 เพื่อเผื่อ text ที่ใหญ่ขึ้น
    const width = box.xMax - box.xMin + padding * 2;
    const height = box.yMax - box.yMin + padding * 2;

    // รอให้ rendering เสร็จก่อน export
    await new Promise(resolve => setTimeout(resolve, 300));

    // สร้าง SVG element ใหม่
    const svgNamespace = "http://www.w3.org/2000/svg";
    const svgElement = document.createElementNS(svgNamespace, "svg");
    svgElement.setAttribute("width", width.toString());
    svgElement.setAttribute("height", height.toString());
    svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svgElement.setAttribute("xmlns", svgNamespace);

    // เพิ่มพื้นหลังสีขาว
    const background = document.createElementNS(svgNamespace, "rect");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", "white");
    svgElement.appendChild(background);

    // สร้าง group element สำหรับ transform
    const group = document.createElementNS(svgNamespace, "g");
    group.setAttribute("transform", `translate(${-box.xMin + padding}, ${-box.yMin + padding})`);

    // คัดลอก nodes และ edges จาก ReactFlow
    const flowNodes = reactFlowElement.querySelectorAll('.react-flow__node');
    const flowEdges = reactFlowElement.querySelectorAll('.react-flow__edge');

    // เพิ่ม edges ก่อน (เพื่อให้อยู่ด้านล่าง)
    flowEdges.forEach(edge => {
      if (!edge.classList.contains('react-flow__edge-interaction')) {
        const edgeClone = edge.cloneNode(true) as SVGElement;
        // ลบ class ที่ไม่จำเป็น
        edgeClone.removeAttribute('class');
        edgeClone.setAttribute('class', 'edge');
        group.appendChild(edgeClone);
      }
    });

    // เพิ่ม nodes
    flowNodes.forEach(node => {
      const nodeClone = node.cloneNode(true) as SVGElement;
      // ลบ class ที่ไม่จำเป็น
      nodeClone.removeAttribute('class');
      nodeClone.setAttribute('class', 'node');
      group.appendChild(nodeClone);
    });

    svgElement.appendChild(group);

    // แปลง SVG element เป็น string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    // เพิ่ม XML declaration
    const svgData = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
${svgString}`;

    // สร้าง blob และ download
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${fileName}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error exporting SVG:', error);

    // ถ้าวิธีข้างต้นไม่สำเร็จ ให้ใช้วิธี fallback ด้วย PNG
    try {
      console.log('Falling back to PNG export...');
      return await exportToPng(reactFlowElement, nodes, edges, fileName);
    } catch (fallbackError) {
      console.error('Fallback to PNG also failed:', fallbackError);
      return false;
    }
  }
};

// ฟังก์ชันสำหรับ export PNG โดยใช้หลักการเดียวกับ SVG
export const exportToPng = async (
  reactFlowElement: HTMLElement,
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  fileName: string
): Promise<boolean> => {
  try {
    if (!nodes.length || !reactFlowElement) return false;

    // คำนวณ bounding box
    const box = getBoundingBoxFromDiagram(nodes, edges);
    if (!box) return false;

    const padding = 50;
    const width = box.xMax - box.xMin + padding * 2;
    const height = box.yMax - box.yMin + padding * 2;

    // สร้าง canvas สำหรับวาดโดยตรง (หลีกเลี่ยง tainted canvas)
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; // เพิ่มความคมชัด
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // ตั้งค่า scale สำหรับความคมชัด
    ctx.scale(2, 2);

    // ไม่ใส่พื้นหลัง เพื่อให้ PNG มีพื้นหลังโปร่งใส

    // เตรียม icon images สำหรับแต่ละ node type
    const iconPathMap: Record<string, string> = {
      firewall: '/src/img/node/firewall-protection.png',
      server: '/src/img/node/servers.png',
      router: '/src/img/node/wireless-router.png',
      switch: '/src/img/node/switch.png',
      pc: '/src/img/node/pc.png',
    };

    // โหลด images แบบ async
    const imagePromises: Promise<{ type: string; img: HTMLImageElement }>[] = [];
    const types = Array.from(new Set(nodes.map(n => n.type).filter((type): type is string => type !== undefined)));
    
    for (const type of types) {
      if (type && iconPathMap[type as keyof typeof iconPathMap]) {
        const path = iconPathMap[type as keyof typeof iconPathMap];
        if (path) {
          imagePromises.push(
            new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve({ type, img });
              img.onerror = reject;
              img.src = path;
            })
          );
        }
      }
    }

    // รอให้ images โหลดเสร็จ
    const loadedImages = await Promise.all(imagePromises);
    const imageMap: Record<string, HTMLImageElement> = {};
    loadedImages.forEach(({ type, img }) => {
      imageMap[type] = img;
    });

    // วาด edges ก่อน (ใช้ข้อมูล edges ที่ส่งมา) - แบบ cubic Bézier curve
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const sourceX = sourceNode.position.x + 32 - box.xMin + padding; // center of icon
        const sourceY = sourceNode.position.y + 32 - box.yMin + padding;
        const targetX = targetNode.position.x + 32 - box.xMin + padding;
        const targetY = targetNode.position.y + 32 - box.yMin + padding;

        // สร้าง cubic Bézier curve เหมือนในแอป
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const curveIntensity = 0.5;
        const offset = curveIntensity * Math.max(distance * 0.4, 40);
        
        // Control points
        const c1x = sourceX + (dx === 0 ? 0 : (dx > 0 ? 1 : -1) * offset);
        const c1y = sourceY + (dy === 0 ? 0 : (dy > 0 ? 1 : -1) * offset);
        const c2x = targetX - (dx === 0 ? 0 : (dx > 0 ? 1 : -1) * offset);
        const c2y = targetY - (dy === 0 ? 0 : (dy > 0 ? 1 : -1) * offset);

        // วาดเส้นโค้งสีเขียวเหมือนในแอป
        ctx.strokeStyle = '#97e30b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sourceX, sourceY);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, targetX, targetY);
        ctx.stroke();

        // วาด bandwidth label ถ้ามี
        const edgeData = edge.data as any;
        if (edgeData?.bandwidth && edgeData?.bandwidthUnit) {
          const label = `${edgeData.bandwidth} ${edgeData.bandwidthUnit}`;
          const midX = (sourceX + targetX) / 2;
          const midY = (sourceY + targetY) / 2;

          // วาดพื้นหลังสำหรับ label
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 1;
          
          const labelWidth = ctx.measureText(label).width + 16;
          const labelHeight = 20;
          const labelX = midX - labelWidth / 2;
          const labelY = midY - labelHeight / 2;
          
          ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
          ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

          // วาดข้อความ
          ctx.fillStyle = '#333333';
          ctx.font = '500 13px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(label, midX, midY + 4);
        }
      }
    });

    // วาด nodes
    nodes.forEach(node => {
      const x = node.position.x - box.xMin + padding;
      const y = node.position.y - box.yMin + padding;
      const iconW = 64;
      const iconH = 64;

      // วาด icon
      if (node.type && imageMap[node.type]) {
        ctx.drawImage(imageMap[node.type], x, y, iconW, iconH);
      } else {
        // fallback: วาด rect
        ctx.fillStyle = '#eeeeee';
        ctx.strokeStyle = '#aaaaaa';
        ctx.fillRect(x, y, iconW, iconH);
        ctx.strokeRect(x, y, iconW, iconH);
      }

      // วาด label
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      const label = (node.data?.label as string) || node.type || 'Unknown';
      ctx.fillText(label, x + iconW / 2, y + iconH + 16);

      // ถ้าเป็น pc และมี userCapacity ให้แสดง Users: ...
      if (node.type === 'pc' && typeof node.data?.userCapacity !== 'undefined' && node.data.userCapacity !== '') {
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Arial';
        ctx.fillText(`Users: ${node.data.userCapacity}`, x + iconW / 2, y + iconH + 30);
      }
    });

    // แปลง canvas เป็น PNG และดาวน์โหลด
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');

    return true;

  } catch (error) {
    console.error('Error exporting PNG (Canvas-based):', error);
    return false;
  }
};

// --- ฟังก์ชันช่วยแปลง path รูปเป็น base64 data URI ---
async function getBase64FromUrl(url: string): Promise<string> {
  try {
    // For local files, create an image element with crossOrigin
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      
      img.onerror = () => {
        // Fallback to fetch method
        fetch(url)
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          })
          .catch(reject);
      };
      
      img.src = url;
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

// --- ฟังก์ชัน export SVG แบบฝัง base64 icon และ clone edge จาก DOM ---
export const exportAsSvgWithBase64Icons = async (
  reactFlowElement: HTMLElement,
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  fileName: string
): Promise<boolean> => {
  try {
    if (!nodes.length || !reactFlowElement) return false;
    // คำนวณ bounding box
    const box = getBoundingBoxFromDiagram(nodes, edges);
    if (!box) return false;
    const padding = 50;
    const width = box.xMax - box.xMin + padding * 2;
    const height = box.yMax - box.yMin + padding * 2;
    // เตรียม base64 icon สำหรับแต่ละ node type
    const iconPathMap: Record<string, string> = {
      firewall: '/src/img/node/firewall-protection.png',
      server: '/src/img/node/servers.png',
      router: '/src/img/node/wireless-router.png',
      switch: '/src/img/node/switch.png',
      pc: '/src/img/node/pc.png',
    };
    const iconBase64Map: Record<string, string> = {};
    // ดึง base64 icon เฉพาะ type ที่มีใน nodes
    const types = Array.from(new Set(nodes.map(n => n.type).filter((type): type is string => type !== undefined)));
    for (const type of types) {
      if (type && iconPathMap[type as keyof typeof iconPathMap]) {
        const path = iconPathMap[type as keyof typeof iconPathMap];
        if (path) {
          iconBase64Map[type] = await getBase64FromUrl(path);
        }
      }
    }
    // สร้าง SVG element
    const svgNamespace = "http://www.w3.org/2000/svg";
    const svgElement = document.createElementNS(svgNamespace, "svg");
    svgElement.setAttribute("width", width.toString());
    svgElement.setAttribute("height", height.toString());
    svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svgElement.setAttribute("xmlns", svgNamespace);

    // เพิ่ม font definitions สำหรับ SVG export
    const defs = document.createElementNS(svgNamespace, "defs");
    const style = document.createElementNS(svgNamespace, "style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      text {
        font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      }
      .node-label {
        font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        font-weight: 600;
      }
      .user-text {
        font-family: 'Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        font-weight: 400;
      }
    `;
    defs.appendChild(style);
    svgElement.appendChild(defs);

    // พื้นหลังขาว
    const background = document.createElementNS(svgNamespace, "rect");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", "white");
    svgElement.appendChild(background);
    // กลุ่มหลัก
    const group = document.createElementNS(svgNamespace, "g");
    group.setAttribute("transform", `translate(${-box.xMin + padding}, ${-box.yMin + padding})`);
    // --- clone edge จาก DOM ---
    const flowEdges = reactFlowElement.querySelectorAll('.react-flow__edge');
    flowEdges.forEach(edge => {
      if (!edge.classList.contains('react-flow__edge-interaction')) {
        const edgeClone = edge.cloneNode(true) as SVGElement;
        // ลบ class ที่ไม่จำเป็น
        edgeClone.removeAttribute('class');
        edgeClone.setAttribute('class', 'edge');
        group.appendChild(edgeClone);
      }
    });
    // --- วาด nodes (icon base64 + label) ---
    nodes.forEach(node => {
      const nodeG = document.createElementNS(svgNamespace, "g");
      nodeG.setAttribute("transform", `translate(${node.position.x},${node.position.y})`);
      const iconW = 64;
      const iconH = 64;
      const iconY = 0;
      const labelY = 76;
      const base64 = node.type ? iconBase64Map[node.type] : undefined;
      if (base64) {
        const image = document.createElementNS(svgNamespace, "image");
        image.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", base64);
        image.setAttribute("x", "0");
        image.setAttribute("y", iconY.toString());
        image.setAttribute("width", iconW.toString());
        image.setAttribute("height", iconH.toString());
        nodeG.appendChild(image);
      } else {
        // fallback: วาด rect
        const rect = document.createElementNS(svgNamespace, "rect");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        rect.setAttribute("width", iconW.toString());
        rect.setAttribute("height", iconH.toString());
        rect.setAttribute("fill", "#eee");
        rect.setAttribute("stroke", "#aaa");
        nodeG.appendChild(rect);
      }
      // label
      const label = document.createElementNS(svgNamespace, "text");
      label.setAttribute("x", (iconW / 2).toString());
      label.setAttribute("y", labelY.toString());
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "12");
      label.setAttribute("font-weight", "bold");
      label.setAttribute("class", "node-label");
      label.textContent = (node.data?.label as string) || node.type || 'Unknown';
      nodeG.appendChild(label);
      // ถ้าเป็น pc และมี userCapacity ให้แสดง Users: ...
      if (node.type === 'pc' && typeof node.data?.userCapacity !== 'undefined' && node.data.userCapacity !== '') {
        const userText = document.createElementNS(svgNamespace, "text");
        userText.setAttribute("x", (iconW / 2).toString());
        userText.setAttribute("y", (labelY + 14).toString());
        userText.setAttribute("text-anchor", "middle");
        userText.setAttribute("font-size", "10");
        userText.setAttribute("fill", "#6b7280"); // text-gray-500
        userText.setAttribute("class", "user-text");
        userText.textContent = `Users: ${node.data.userCapacity}`;
        nodeG.appendChild(userText);
      }
      group.appendChild(nodeG);
    });
    svgElement.appendChild(group);
    // serialize
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const svgData = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n${svgString}`;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${fileName}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exporting SVG (base64 icons + clone edge):', error);
    return false;
  }
};