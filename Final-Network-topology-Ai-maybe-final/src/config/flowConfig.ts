import RouterNode from '@/components/Node/RouterNode';
import SwitchNode from '@/components/Node/SwitchNode';
import FirewallNode from '@/components/Node/FireWallNode';
import ServerNode from '@/components/Node/ServerNode';
import PCNode from '@/components/Node/PCNode';
import { EdgeStyle } from '../components/Edges/EdgeStyle';
import type { ComponentType } from 'react';

export const nodeTypes = {
  router: RouterNode,
  switch: SwitchNode,
  firewall: FirewallNode,
  server: ServerNode,
  pc: PCNode,
};

export const edgeTypes: { [key: string]: ComponentType<any> } = {
  custom: EdgeStyle,
};
