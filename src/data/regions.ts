export type JobRegionNode = {
  code: string
  name: string
  children?: JobRegionNode[]
}

export const jobRegions: JobRegionNode[] = [
  { code: 'ALL', name: '전체' },
  { code: 'SEOUL', name: '서울' },
  {
    code: 'GG',
    name: '경기',
    children: [
      { code: 'GG-ANSAN', name: '안산' },
      { code: 'GG-SIHEUNG', name: '시흥' },
      { code: 'GG-HWASEONG', name: '화성' },
      { code: 'GG-SUWON', name: '수원' },
      { code: 'GG-PYEONGTAEK', name: '평택' },
      { code: 'GG-GIMPO', name: '김포' },
      { code: 'GG-BUCHEON', name: '부천' },
      { code: 'GG-SEONGNAM', name: '성남' },
    ],
  },
  { code: 'IC', name: '인천' },
  {
    code: 'CB',
    name: '충북',
    children: [
      {
        code: 'CB-CHEONGJU',
        name: '청주',
        children: [
          { code: 'CB-CHEONGJU-SANGDANG', name: '상당구' },
          { code: 'CB-CHEONGJU-SEOWON', name: '서원구' },
          { code: 'CB-CHEONGJU-HEUNGDEOK', name: '흥덕구' },
          { code: 'CB-CHEONGJU-CHEONGWON', name: '청원구' },
        ],
      },
      { code: 'CB-CHUNGJU', name: '충주' },
      { code: 'CB-JECHEON', name: '제천' },
      { code: 'CB-EUMSEONG', name: '음성' },
      { code: 'CB-JINCHEON', name: '진천' },
      { code: 'CB-GOESAN', name: '괴산' },
      { code: 'CB-JEUNGPYEONG', name: '증평' },
      { code: 'CB-BOEUN', name: '보은' },
      { code: 'CB-OKCHEON', name: '옥천' },
      { code: 'CB-YEONGDONG', name: '영동' },
      { code: 'CB-DANYANG', name: '단양' },
    ],
  },
  {
    code: 'CN',
    name: '충남',
    children: [
      { code: 'CN-CHEONAN', name: '천안' },
      { code: 'CN-ASAN', name: '아산' },
      { code: 'CN-DANGJIN', name: '당진' },
      { code: 'CN-SEOSAN', name: '서산' },
      { code: 'CN-NONSAN', name: '논산' },
      { code: 'CN-GONGJU', name: '공주' },
      { code: 'CN-BORYEONG', name: '보령' },
      { code: 'CN-HONGSEONG', name: '홍성' },
    ],
  },
  { code: 'DJ', name: '대전' },
  { code: 'SJ', name: '세종' },
  {
    code: 'GN',
    name: '경남',
    children: [
      { code: 'GN-CHANGWON', name: '창원' },
      { code: 'GN-GIMHAE', name: '김해' },
      { code: 'GN-YANGSAN', name: '양산' },
      { code: 'GN-GEOJE', name: '거제' },
      { code: 'GN-JINJU', name: '진주' },
    ],
  },
  { code: 'GB', name: '경북' },
  { code: 'BS', name: '부산' },
  { code: 'DG', name: '대구' },
  { code: 'US', name: '울산' },
  { code: 'JB', name: '전북' },
  { code: 'JN', name: '전남' },
  { code: 'GJ', name: '광주' },
  { code: 'GW', name: '강원' },
  { code: 'JJ', name: '제주' },
]

export function flattenJobRegions(nodes: JobRegionNode[] = jobRegions): JobRegionNode[] {
  return nodes.flatMap((node) => [node, ...(node.children ? flattenJobRegions(node.children) : [])])
}
