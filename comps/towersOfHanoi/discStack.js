
const DiscStack = ({towers}) =>{

    const TOWER_HEIGHT = 7;

    const getDiscStack = (col, disks, towerHeight) =>{

        let newDisks = [];

        while(disks.length > 0){
            newDisks.push(disks.pop());
        }

        while(newDisks.length < towerHeight){
            newDisks.unshift(-1);
        }
        const colorClasses = ['bg-primary', 'bg-danger', 'bg-success', 'bg-warning', 'bg-info'];
        return (
            newDisks.map( (x, index) =>{
                const colorClass = x !== -1 ? colorClasses[x%5] : "bg-secondary";
                const colSize = x !== -1 ? x*2 : 2;
                const colOffset = x !== -1 ? (12 - (x*2))/2 : 5;
                return (
                 <div className="row" key={`${col}-disk-${index}`}>
                    <div className={`col-sm-${colSize} offset-sm-${colOffset} ${colorClass}`}><span>&nbsp;</span></div>    
                 </div>);    
              })
        );
    }

    return(
        <div className="container">
            <div className="row">
                <div className="col-sm">
                    {getDiscStack('A', [...towers.A], TOWER_HEIGHT)}
                </div>
                <div className="col-sm">
                    {getDiscStack('B', [...towers.B], TOWER_HEIGHT)}
                </div>
                <div className="col-sm">
                    {getDiscStack('C', [...towers.C], TOWER_HEIGHT)}
                </div>
            </div>
        </div>
    );
}


export default DiscStack;
