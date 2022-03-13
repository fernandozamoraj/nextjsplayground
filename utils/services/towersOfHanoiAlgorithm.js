export function towersOfHanoi(disks, from_rod, to_rod, aux_rod, moves){

    if (disks == 0)
    {
        return;
    }

    towersOfHanoi(disks - 1, from_rod, aux_rod, to_rod, moves);
    console.log(`Move disk ${disks} from rod ${from_rod} to rod ${to_rod} `);
    moves.push({from: from_rod, to: to_rod})
    towersOfHanoi(disks - 1, aux_rod, to_rod, from_rod, moves);
}

export function solveTowersOfHanoi(disks, moves){
    towersOfHanoi(disks, 'A', 'C', 'B', moves);
}