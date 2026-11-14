// 教学线：两班、目标 2,500 件/日。现有设备和周期均为场景假设。
FactorySkill.define({
  id: 'parcel-sort-lab',
  title: '包裹分拣工坊',
  prompt: '这条两班制出库线，每天能处理 2,500 个包裹吗？',
  fig: 'FACTORY SKILL',
  kicker: '包裹出库 · 离散事件仿真',
  product: { name: '包裹', unit: '件', perToken: 1 },
  demand: { perDay: 2500 },
  calendar: { shifts: 2, hoursPerShift: 8, startHour: 7 },
  sizing: { targetUtil: 0.85 },
  release: 'capacity',
  seed: 17,
  stations: [
    {
      id: 'intake', name: '到件拆垛', machine: 'kitting', input: 'tote', stage: 'carton',
      ct: 14, cv: 0.11, buffer: 5, servers: 1,
      color: '#16827b', note: '教学假设 · 一名操作员从周转箱取出纸箱，平均 14 秒/件。'
    },
    {
      id: 'weigh', name: '尺寸与称重', machine: 'vision', after: ['intake'], stage: 'weighed',
      ct: 11, cv: 0.05, buffer: 6, servers: 1, color: '#428fb1',
      note: '教学假设 · 量测、上传并确认包裹重量和尺寸，平均 11 秒/件。'
    },
    {
      id: 'print', name: '订单面单', machine: 'cell', input: 'paper', stage: 'label',
      ct: 10, cv: 0.07, buffer: 6, servers: 1, color: '#c8a764',
      note: '教学假设 · 打印分支向合流台提供一件面单，平均 10 秒/件。'
    },
    {
      id: 'apply', name: '配对贴单', machine: 'bench', after: ['weigh', 'print'], stage: 'labeled',
      ct: 18, cv: 0.13, buffer: 7, servers: 1, operators: 1, color: '#8672ad',
      note: '教学假设 · 包裹和对应面单到齐后合流，由操作员配对粘贴，平均 18 秒/件。'
    },
    {
      id: 'verify', name: '扫码复核', machine: 'tester', after: ['apply'], stage: 'passed',
      ct: 34, cv: 0.07, buffer: 6, servers: 1, reserve: 2, mtbf: 7 * 3600,
      mttr: 12 * 60, yield: 0.985, color: '#c95d38',
      note: '教学假设 · 单工位检查面单可读性和订单一致性，平均 34 秒/件，合格率 98.5%。此处可加第二台试试。'
    },
    {
      id: 'sort', name: '分区集包', machine: 'robot', after: ['verify'], stage: 'packed',
      ct: 12, cv: 0.06, buffer: 5, servers: 1, mtbf: 8 * 3600,
      mttr: 15 * 60, color: '#34795b',
      note: '教学假设 · 以一个汇总出库工位表示按目的地集包，平均 12 秒/件。合格包裹计入出库。'
    }
  ],
  stages: {
    tote: { shape: 'tote', color: '#477ba1' },
    carton: { shape: 'box', color: '#ba8d52' },
    weighed: { shape: 'box', color: '#c7a170' },
    paper: { shape: 'roll', color: '#eeecdc' },
    label: { shape: 'sheet', color: '#f1e2a6', scale: 0.7 },
    labeled: { shape: 'box', color: '#dfac5c' },
    passed: { shape: 'box', color: '#dabe7f' },
    packed: { shape: 'crate', color: '#508f6f' }
  },
  look: { tilt: { focusY: 0.47, band: 0.12, amount: 16 } }
});
